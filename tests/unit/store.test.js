// Unit test for store.addPayment with full Firebase mock
globalThis.__TEST__ = true;
globalThis.firebase = {
    initializeApp: () => { },
    firestore: () => ({
        collection: (name) => ({
            // onSnapshot mock – immediately invoke with empty docs
            onSnapshot: (cb) => { cb({ docs: [] }); return { unsubscribe: () => { } }; },
            // doc reference mock
            doc: (id) => ({
                set: async () => { },
                update: async (data) => {
                    if (name === 'debts' && id === 'debt1') {
                        globalThis.lastDebtUpdate = data;
                    }
                },
                delete: async () => { },
                get: async () => ({ exists: true, data: () => ({}) })
            }),
            // add mock returns mock id
            add: async (doc) => ({ id: 'mockId', ...doc }),
            // get mock for collection (used in migration)
            get: async () => ({ empty: true, docs: [] })
        }),
        // batch mock for migrations
        batch: () => ({
            set: () => { },
            update: () => { },
            delete: () => { },
            commit: async () => { }
        })
    })
};

async function runTest() {
    // Dynamic import to ensure globalThis.__TEST__ is set before store is imported
    const { store } = await import('../../js/store.js');

    // Disable real Firestore listeners for the test environment
    store.setupListeners = () => { };
    // Replace the store's db with the mocked Firestore instance
    store.db = globalThis.firebase.firestore();

    async function testAddPayment() {
        const initialDebt = { id: 'debt1', balance: 10, personId: store.getCurrentUserId() };
        store.data.debts = [initialDebt];
        await store.addPayment({ debtId: 'debt1', amount: 5, date: new Date().toISOString() });
        // Verify that updateDebt was called with correct balance
        console.assert(globalThis.lastDebtUpdate && globalThis.lastDebtUpdate.balance === 5, 'Balance update should be 5');
        console.log('store.addPayment unit test passed');
    }

    await testAddPayment();
}

runTest();
