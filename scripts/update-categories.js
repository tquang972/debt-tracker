// Script to update categories for all debts in Firebase
// Run with: node scripts/update-categories.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set GOOGLE_APPLICATION_CREDENTIALS env var)
// Or replace with your service account key
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Category mapping rules based on debt names
const categorizeDebt = (name, note = '') => {
    const lowerName = name.toLowerCase();
    const lowerNote = (note || '').toLowerCase();

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
        lowerName.includes('biz card')) {
        return 'Credit Card';
    }

    // Loan (personal loans, business loans)
    if (lowerName.includes('loan') || lowerName.includes('personal loan') || lowerName.includes('biz loan')) {
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

    // Student Loan
    if (lowerName.includes('student')) {
        return 'Loan';
    }

    // Tax
    if (lowerName.includes('tax')) {
        return 'Other';
    }

    // Personal debts (Zelle, owes, debt to person)
    if (lowerName.includes('zelle') || lowerName.includes('owns') || lowerName.includes('debt')) {
        return 'Loan';
    }

    // Robinhood Gold (investment platform)
    if (lowerName.includes('robinhood')) {
        return 'Other';
    }

    // Nhan SF - unclear what SF means
    if (lowerName.includes('nhan sf')) {
        return 'Other'; // NEEDS CLARIFICATION
    }

    return 'Uncategorized';
};

async function updateCategories() {
    console.log('Fetching all debts from Firebase...');

    const debtsRef = db.collection('debts');
    const snapshot = await debtsRef.get();

    console.log(`Found ${snapshot.size} debts`);

    const updates = [];
    const unclear = [];

    snapshot.forEach(doc => {
        const debt = doc.data();
        const category = categorizeDebt(debt.name, debt.note);

        if (category === 'Uncategorized') {
            unclear.push({ id: doc.id, name: debt.name, note: debt.note });
        }

        updates.push({
            id: doc.id,
            name: debt.name,
            category: category
        });
    });

    // Log unclear items
    if (unclear.length > 0) {
        console.log('\n⚠️  UNCLEAR CATEGORIES (need user input):');
        unclear.forEach(d => {
            console.log(`  - ${d.name} (note: ${d.note || 'none'})`);
        });
        console.log('');
    }

    // Show preview
    console.log('\n📋 Category Assignments:');
    const byCategory = {};
    updates.forEach(u => {
        if (!byCategory[u.category]) byCategory[u.category] = [];
        byCategory[u.category].push(u.name);
    });

    Object.entries(byCategory).forEach(([cat, names]) => {
        console.log(`\n${cat}:`);
        names.forEach(n => console.log(`  - ${n}`));
    });

    // Apply updates
    console.log('\n\n🔄 Applying updates...');
    const batch = db.batch();

    updates.forEach(u => {
        const ref = debtsRef.doc(u.id);
        batch.update(ref, { category: u.category });
    });

    await batch.commit();
    console.log('✅ All categories updated!');

    process.exit(0);
}

updateCategories().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
