// Unit tests for store.addPayment
import { store } from '../../js/store.js';

// Mock Firestore methods (simple in-memory mock)
const mockDb = {
    collection: (name) => {
        const data = [];
        return {
            add: async (doc) => {
                const id = Math.random().toString(36).substring(2, 9);
                data.push({ id, ...doc });
                return { id };
            },
            get: async () => ({ exists: true, data: () => ({}) })
        };
    }
};

// Replace real db with mock for test
store.db = mockDb;

async function testAddPayment() {
    const initialDebt = { id: 'debt1', balance: 10, personId: store.getCurrentUserId() };
    store.data.debts = [initialDebt];
    await store.addPayment({ debtId: 'debt1', amount: 5, date: new Date().toISOString() });
    const updatedDebt = store.data.debts.find(d => d.id === 'debt1');
    console.assert(updatedDebt.balance === 5, 'Balance should be reduced to 5');
    console.log('store.addPayment unit test passed');
}

testAddPayment();
