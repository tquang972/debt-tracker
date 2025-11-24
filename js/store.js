import { db } from './firebase-config.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    getDocs,
    writeBatch
} from "firebase/firestore";
import { initialData } from './initialData.js';

const STORAGE_KEY = 'debt_tracker_data_v13';

export class Store {
    constructor() {
        this.data = {
            people: [],
            debts: [],
            payments: []
        };
        this.currentUserId = 'me';
        this.listeners = [];
        this.initialized = false;

        this.init();
    }

    async init() {
        // 1. Setup Real-time Listeners
        this.setupListeners();

        // 2. Check for Migration (only if we haven't initialized before)
        // We wait a bit for the first snapshot to arrive
        setTimeout(async () => {
            if (this.data.people.length === 0) {
                await this.migrateData();
            }
        }, 2000);
    }

    setupListeners() {
        // Users
        onSnapshot(collection(db, 'users'), (snapshot) => {
            this.data.people = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.setDefaultUser();
            this.notifyListeners();
        });

        // Debts
        onSnapshot(collection(db, 'debts'), (snapshot) => {
            this.data.debts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.notifyListeners();
        });

        // Payments
        onSnapshot(collection(db, 'payments'), (snapshot) => {
            this.data.payments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.notifyListeners();
        });
    }

    setDefaultUser() {
        if (this.data.people.length > 0 && this.currentUserId === 'me') {
            this.currentUserId = this.data.people.find(p => p.isDefault)?.id || this.data.people[0].id;
        }
    }

    async migrateData() {
        console.log("Checking migration...");
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) return; // Already has data

        console.log("Migrating initial data to Firestore...");

        // Prefer localStorage data if available (it might have user edits)
        let sourceData = initialData;
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (parsed.people && parsed.people.length > 0) {
                    sourceData = parsed;
                    console.log("Using localStorage data for migration");
                }
            } catch (e) {
                console.error("Local storage parse error", e);
            }
        }

        const batch = writeBatch(db);

        // Upload People
        // We use the ID from source as the Doc ID to maintain relationships
        for (const p of sourceData.people) {
            const ref = doc(db, 'users', p.id);
            batch.set(ref, { name: p.name, isDefault: p.isDefault || false });
        }

        // Upload Debts
        for (const d of sourceData.debts) {
            const ref = doc(db, 'debts', d.id);
            batch.set(ref, {
                name: d.name,
                balance: d.balance,
                dueDate: d.dueDate,
                personId: d.personId,
                note: d.note || ''
            });
        }

        // Upload Payments
        for (const p of sourceData.payments) {
            const ref = doc(db, 'payments', p.id);
            batch.set(ref, {
                debtId: p.debtId,
                amount: p.amount,
                date: p.date,
                note: p.note || ''
            });
        }

        await batch.commit();
        console.log("Migration complete!");
    }

    // --- Subscription ---
    subscribe(listener) {
        this.listeners.push(listener);
        // Call immediately with current state
        listener();
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(l => l());
    }

    // --- People ---
    getPeople() {
        return this.data.people;
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    setCurrentUserId(id) {
        this.currentUserId = id;
        this.notifyListeners();
    }

    async addPerson(name) {
        await addDoc(collection(db, 'users'), { name, isDefault: false });
    }

    // --- Debts ---
    getDebts(personId = this.currentUserId) {
        if (personId === 'all') return this.data.debts;
        return this.data.debts.filter(d => d.personId === personId);
    }

    async addDebt(debt) {
        await addDoc(collection(db, 'debts'), debt);
    }

    async updateDebt(id, updates) {
        await updateDoc(doc(db, 'debts', id), updates);
    }

    async deleteDebt(id) {
        await deleteDoc(doc(db, 'debts', id));
    }

    // --- Payments ---
    getPayments() {
        return this.data.payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async addPayment(payment) {
        await addDoc(collection(db, 'payments'), payment);

        // Update debt balance
        const debt = this.data.debts.find(d => d.id === payment.debtId);
        if (debt) {
            const newBalance = parseFloat(debt.balance) - parseFloat(payment.amount);
            await this.updateDebt(debt.id, { balance: newBalance });
        }
    }
}

export const store = new Store();
