import { db } from './firebase-config.js';
import { initialData } from './initialData.js';

// Predefined categories for debt classification
export const CATEGORIES = [
    'Auto',
    'Credit Card',
    'Loan',
    'Utilities',
    'Insurance',
    'Medical',
    'Other',
    'Uncategorized'
];

const STORAGE_KEY = 'debt_tracker_data_v13';

export class Store {
    constructor() {
        console.log("[Store] Constructor called");
        this.data = {
            people: [],
            debts: [],
            payments: []
        };
        this.db = db;
        this.currentUserId = 'me';
        this.listeners = [];
        this.initialized = false;
        if (globalThis.__TEST__) {
            console.log('[Store] Test mode - skipping init');
            this.initialized = true;
            return;
        }
        this.init();
    }

    async init() {
        console.log("[Store] Init started");
        // 1. Setup Real-time Listeners
        this.setupListeners();
        console.log("[Store] Listeners setup complete");

        // 2. Check for Migration
        setTimeout(async () => {
            console.log("[Store] Migration check - people.length:", this.data.people.length);
            if (this.data.people.length === 0) {
                await this.migrateData();
            } else {
                console.log("[Store] Data already exists, skipping migration");
            }
        }, 2000);
    }

    setupListeners() {
        console.log("[Store] Setting up Firestore listeners");
        // Users
        this.db.collection('users').onSnapshot((snapshot) => {
            console.log("[Store] Users snapshot received:", snapshot.docs.length, "users");
            this.data.people = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.setDefaultUser();
            this.notifyListeners();
        });

        // Debts
        this.db.collection('debts').onSnapshot((snapshot) => {
            console.log("[Store] Debts snapshot received:", snapshot.docs.length, "debts");
            this.data.debts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            this.notifyListeners();
        });

        // Payments
        this.db.collection('payments').onSnapshot((snapshot) => {
            console.log("[Store] Payments snapshot received:", snapshot.docs.length, "payments");
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
        const usersSnap = await this.db.collection('users').get();
        if (!usersSnap.empty) return; // Already has data

        console.log("Migrating initial data to Firestore...");

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

        const batch = this.db.batch();

        // Upload People
        for (const p of sourceData.people) {
            const ref = this.db.collection('users').doc(p.id);
            batch.set(ref, { name: p.name, isDefault: p.isDefault || false });
        }

        // Upload Debts
        for (const d of sourceData.debts) {
            const ref = this.db.collection('debts').doc(d.id);
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
            const ref = this.db.collection('payments').doc(p.id);
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
        console.log("[Store] Subscriber added, total:", this.listeners.length + 1);
        this.listeners.push(listener);
        listener();
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        console.log("[Store] Notifying", this.listeners.length, "listeners");
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
        await this.db.collection('users').add({ name, isDefault: false });
    }

    // --- Debts ---
    getDebts(personId = this.currentUserId) {
        if (personId === 'all') return this.data.debts;
        return this.data.debts.filter(d => d.personId === personId);
    }

    async addDebt(debt) {
        await this.db.collection('debts').add(debt);
    }

    async updateDebt(id, updates) {
        await this.db.collection('debts').doc(id).update(updates);
    }

    async deleteDebt(id) {
        await this.db.collection('debts').doc(id).delete();
    }

    // --- Payments ---
    getPayments() {
        return this.data.payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async addPayment(payment) {
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        const operation = async () => {
            await this.db.collection('payments').add(payment);
            const debt = this.data.debts.find(d => d.id === payment.debtId);
            if (debt) {
                const newBalance = parseFloat(debt.balance) - parseFloat(payment.amount);
                await this.updateDebt(debt.id, { balance: newBalance });
            }
        };

        await Promise.race([operation(), timeout]);
    }

    async deletePayment(paymentId) {
        const paymentRef = this.db.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) {
            console.error("Payment not found");
            return;
        }

        const payment = paymentDoc.data();

        // Revert debt balance
        const debt = this.data.debts.find(d => d.id === payment.debtId);
        if (debt) {
            const newBalance = parseFloat(debt.balance) + parseFloat(payment.amount);
            await this.updateDebt(debt.id, { balance: newBalance });
        }

        await paymentRef.delete();
    }

    async permanentlyDeletePayment(paymentId) {
        // Delete payment without affecting debt balance
        await this.db.collection('payments').doc(paymentId).delete();
    }

    async updatePayment(paymentId, newData) {
        const paymentRef = this.db.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) return;

        const oldPayment = paymentDoc.data();

        // Handle debt reassignment
        if (newData.debtId && newData.debtId !== oldPayment.debtId) {
            const oldDebt = this.data.debts.find(d => d.id === oldPayment.debtId);
            const newDebt = this.data.debts.find(d => d.id === newData.debtId);

            // Revert payment from old debt
            if (oldDebt) {
                const oldDebtNewBalance = parseFloat(oldDebt.balance) + parseFloat(oldPayment.amount);
                await this.updateDebt(oldDebt.id, { balance: oldDebtNewBalance });
            }

            // Apply payment to new debt (use new amount if provided, otherwise old amount)
            if (newDebt) {
                const paymentAmount = newData.amount || oldPayment.amount;
                const newDebtNewBalance = parseFloat(newDebt.balance) - parseFloat(paymentAmount);
                await this.updateDebt(newDebt.id, { balance: newDebtNewBalance });
            }
        } else if (newData.amount && newData.amount !== oldPayment.amount) {
            // Only amount changed, same debt
            const debt = this.data.debts.find(d => d.id === oldPayment.debtId);
            if (debt) {
                const diff = parseFloat(newData.amount) - parseFloat(oldPayment.amount);
                const newBalance = parseFloat(debt.balance) - diff;
                await this.updateDebt(debt.id, { balance: newBalance });
            }
        }

        await paymentRef.update(newData);
    }
}

export const store = new Store();
