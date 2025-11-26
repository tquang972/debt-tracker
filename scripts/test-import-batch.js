/**
 * Test Import - Batch of 5 Payments for Quang
 * 
 * This script imports the NEXT 5 payments for Quang (after "mom's amex")
 * to verify the import process with a larger batch.
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

async function testImportBatch() {
    console.log('=== Test Import - Batch of 5 Payments ===\n');

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

    // Load parsed data
    const filePath = join(__dirname, '../data/parsed-archive-data.json');
    const payments = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Filter for Quang's payments
    const quangPayments = payments.filter(p => p.person === 'Quang');

    // Find start index (after "mom's amex")
    const startIndex = quangPayments.findIndex(p => p.debtName.toLowerCase().includes("mom's amex") && p.amount === 2297);

    if (startIndex === -1) {
        throw new Error('Could not find start payment (mom\'s amex)');
    }

    // Get next 5 payments
    const batch = quangPayments.slice(startIndex + 1, startIndex + 6);

    console.log(`Found ${batch.length} payments to import:\n`);
    batch.forEach(p => console.log(`- ${p.debtName}: $${p.amount} (${p.date})`));
    console.log('\nStarting import...\n');

    let importedCount = 0;

    for (const payment of batch) {
        try {
            console.log(`Importing: ${payment.debtName}...`);

            // Create debt (as receipt)
            const debtRef = await addDoc(collection(db, 'debts'), {
                name: payment.debtName,
                balance: payment.amount,
                dueDate: payment.date,
                personId: quangId,
                note: payment.note,
                createdAt: new Date().toISOString()
            });

            // Create payment (to zero out the debt)
            await addDoc(collection(db, 'payments'), {
                debtId: debtRef.id,
                amount: payment.amount,
                date: payment.date,
                note: payment.note,
                createdAt: new Date().toISOString()
            });

            // Update debt balance to 0 so it doesn't show in Upcoming
            const { updateDoc, doc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'debts', debtRef.id), { balance: 0 });

            console.log('  ✓ Created debt and payment, set balance to 0');
            importedCount++;

        } catch (error) {
            console.error(`  ✗ Failed to import ${payment.debtName}:`, error.message);
        }
    }

    console.log('\n=== Batch Import Complete ===');
    console.log(`✓ Successfully imported ${importedCount} payments`);
    console.log('\nNext steps:');
    console.log('1. Open the app: https://tquang972.github.io/debt-tracker/');
    console.log('2. Switch to Quang profile');
    console.log('3. Go to History tab');
    console.log('4. Verify the 5 new payments appear correctly');
}

testImportBatch()
    .then(() => {
        console.log('\n✓ Batch import script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n✗ Batch import script failed:', error);
        process.exit(1);
    });
