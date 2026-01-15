// =========================================
// PASTE THIS IN BROWSER CONSOLE WHILE LOGGED IN
// Go to http://localhost:8080 > Login > Open DevTools > Console > Paste
// =========================================

(async function updateAllCategories() {
    const db = firebase.firestore();

    // Category mapping rules based on debt names
    const categorizeDebt = (name, note = '') => {
        const lowerName = name.toLowerCase();

        // Auto (car payments)
        if (lowerName.includes('tesla') || lowerName.includes('honda')) {
            return 'Auto';
        }

        // Credit Card (Amex, BOA, Chase, Barclay, specific cards)
        if (lowerName.includes('amex') ||
            lowerName.includes('boa') ||
            lowerName.includes('chase') ||
            lowerName.includes('barclay') ||
            lowerName.includes('gold card') ||
            lowerName.includes('bus ink') ||
            lowerName.includes('biz card') ||
            lowerName.includes('sw biz')) {
            return 'Credit Card';
        }

        // Loan (personal loans, business loans)
        if (lowerName.includes('loan') || lowerName.includes('biz loan')) {
            return 'Loan';
        }

        // Utilities (water, gas, phone)
        if (lowerName.includes('water') || lowerName.includes('spire') || lowerName.includes('phone')) {
            return 'Utilities';
        }

        // Insurance
        if (lowerName.includes('statefarm') || lowerName.includes('insurance') || lowerName.includes('state farm')) {
            return 'Insurance';
        }

        // Tax
        if (lowerName.includes('tax')) {
            return 'Other';
        }

        // Personal debts (Zelle to family, owes, debt to person)
        if (lowerName.includes('zelle') || lowerName.includes('owns')) {
            return 'Loan';
        }

        // Explicit debt references
        if (lowerName.includes("debt") && !lowerName.includes("card")) {
            return 'Loan';
        }

        // Robinhood Gold (investment/credit platform)
        if (lowerName.includes('robinhood')) {
            return 'Credit Card';
        }

        // Nhan SF - Insurance
        if (lowerName.includes('nhan sf')) {
            return 'Insurance';
        }

        return 'Uncategorized';
    };

    console.log('📋 Fetching all debts...');
    const snapshot = await db.collection('debts').get();
    console.log(`Found ${snapshot.size} debts`);

    const byCategory = {};
    const updates = [];

    snapshot.forEach(doc => {
        const debt = doc.data();
        const category = categorizeDebt(debt.name, debt.note);

        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(debt.name);

        updates.push({ id: doc.id, category });
    });

    // Preview
    console.log('\n📊 Category Assignments:');
    Object.entries(byCategory).sort().forEach(([cat, names]) => {
        console.log(`\n%c${cat}:`, 'font-weight: bold; color: gold;');
        names.forEach(n => console.log(`  - ${n}`));
    });

    // Apply updates
    console.log('\n🔄 Applying updates...');
    const batch = db.batch();

    for (const u of updates) {
        const ref = db.collection('debts').doc(u.id);
        batch.update(ref, { category: u.category });
    }

    await batch.commit();
    console.log('%c✅ All categories updated! Refresh the page to see changes.', 'color: green; font-weight: bold;');
})();
