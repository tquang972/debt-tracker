/**
 * Test Import - Single Payment for Quang
 * 
 * This script imports ONE payment to test the import process.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlHN2wkO5lLvxNgDCVMuWKfqCGLlZvN3I",
    authDomain: "debt-tracker-cf9e6.firebaseapp.com",
    projectId: "debt-tracker-cf9e6",
    storageBucket: "debt-tracker-cf9e6.firebasestorage.app",
    messagingSenderId: "1026816267863",
    appId: "1:1026816267863:web:a5d5c1d9e5f5e5e5e5e5e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testImport() {
    console.log('=== Test Import - Single Payment ===\n');

    // Get Quang's ID
    console.log('Fetching Quang ID from Firestore...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let quangId = null;

    usersSnapshot.forEach(doc => {
        if (doc.data().name === 'Quang') {
            quangId = doc.id;
        }
    });

    if (!quangId) {
        throw new Error('Could not find Quang in users collection');
    }

    console.log(`✓ Found Quang ID: ${quangId}\n`);

    // Load parsed data and get first Quang payment
    const filePath = join(__dirname, '../data/parsed-archive-data.json');
    const payments = JSON.parse(readFileSync(filePath, 'utf-8'));
    const quangPayment = payments.find(p => p.person === 'Quang');

    if (!quangPayment) {
        throw new Error('No Quang payments found in parsed data');
    }

    console.log('Test payment:');
    console.log(`  Line: ${quangPayment.lineNumber}`);
    console.log(`  Name: ${quangPayment.debtName}`);
    console.log(`  Amount: $${quangPayment.amount}`);
    console.log(`  Date: ${quangPayment.date}`);
    console.log(`  Note: ${quangPayment.note}\n`);

    console.log('Creating debt...');
    const debtRef = await addDoc(collection(db, 'debts'), {
        name: quangPayment.debtName,
        balance: quangPayment.amount,
        dueDate: quangPayment.date,
        personId: quangId,
        note: quangPayment.note,
        createdAt: new Date().toISOString()
    });
    console.log(`✓ Debt created with ID: ${debtRef.id}\n`);

    console.log('Creating payment...');
    const paymentRef = await addDoc(collection(db, 'payments'), {
        debtId: debtRef.id,
        amount: quangPayment.amount,
        date: quangPayment.date,
        note: quangPayment.note,
        createdAt: new Date().toISOString()
    });
    console.log(`✓ Payment created with ID: ${paymentRef.id}\n`);

    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'debts', debtRef.id), { balance: 0 });
    console.log('✓ Debt balance set to 0 (should hide from Upcoming)');
    console.log('=== Test Complete ===');
    console.log('✓ Successfully imported 1 payment for Quang');
    console.log('\nNext steps:');
    console.log('1. Open the app: https://tquang972.github.io/debt-tracker/');
    console.log('2. Switch to Quang profile');
    console.log('3. Go to History tab');
    console.log('4. Look for the payment with [I] tag');
    console.log('5. Verify it shows correctly');
    console.log('\nIf it looks good, run the full import with:');
    console.log('  node scripts/import-to-firebase.js');
}

testImport()
    .then(() => {
        console.log('\n✓ Test import completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n✗ Test import failed:', error);
        process.exit(1);
    });
