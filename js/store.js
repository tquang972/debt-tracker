import { initialData } from './initialData.js';

const STORAGE_KEY = 'debt_tracker_data_v13';

const defaultData = initialData;

export class Store {
    constructor() {
        this.data = this.load();
        // Fallback to first person if no default found, or 'me' if list empty
        this.currentUserId = this.data.people.find(p => p.isDefault)?.id || this.data.people[0]?.id || 'me';
    }

    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : defaultData;
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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
    }

    addPerson(name) {
        const id = 'p_' + Date.now();
        this.data.people.push({ id, name, isDefault: false });
        this.save();
        return id;
    }

    // --- Debts ---
    getDebts(personId = this.currentUserId) {
        if (personId === 'all') return this.data.debts;
        return this.data.debts.filter(d => d.personId === personId);
    }

    addDebt(debt) {
        const newDebt = { ...debt, id: 'd_' + Date.now() };
        this.data.debts.push(newDebt);
        this.save();
        return newDebt;
    }

    updateDebt(id, updates) {
        const index = this.data.debts.findIndex(d => d.id === id);
        if (index !== -1) {
            this.data.debts[index] = { ...this.data.debts[index], ...updates };
            this.save();
        }
    }

    deleteDebt(id) {
        this.data.debts = this.data.debts.filter(d => d.id !== id);
        this.save();
    }

    // --- Payments ---
    getPayments() {
        return this.data.payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    addPayment(payment) {
        const newPayment = { ...payment, id: 'pay_' + Date.now() };
        this.data.payments.push(newPayment);

        // Update debt balance
        const debt = this.data.debts.find(d => d.id === payment.debtId);
        if (debt) {
            const newBalance = parseFloat(debt.balance) - parseFloat(payment.amount);
            this.updateDebt(debt.id, { balance: newBalance });
        }

        this.save();
        return newPayment;
    }
}

export const store = new Store();
