/**
 * Firebase Import Script - Import Archive Data
 * 
 * This script imports the parsed payment data into Firebase Firestore.
 * 
 * For each payment, it will:
 * 1. Create a debt record (as a receipt)
 * 2. Create a payment record for the same amount (so balance = 0)
 * 
 * All imported records are tagged with [I] in the note field.
 * 
 * IMPORTANT: Run this script ONCE. Running it multiple times will create duplicates.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

// Get person IDs from Firestore
async function getPersonIds() {
    const { getDocs } = await import('firebase/firestore');
    const peopleSnapshot = await getDocs(collection(db, 'users'));
    const people = {};
    peopleSnapshot.forEach(doc => {
        people[doc.data().name] = doc.id;
    });
    return people;
}

async function importArchiveData() {
    console.log('=== Archive Data Import ===\n');

    // Get person IDs
    console.log('Fetching person IDs from Firestore...');
    const people = await getPersonIds();
    const thanId = people['Pop']; // User clarified Than is Pop
    const quangId = people['Quang'];

    if (!thanId || !quangId) {
        throw new Error('Could not find Than or Quang in users collection');
    }

    console.log(`✓ Found Than ID: ${thanId}`);
    console.log(`✓ Found Quang ID: ${quangId}\n`);

    // Load parsed data
    const filePath = join(__dirname, '../data/parsed-archive-data.json');
    const payments = JSON.parse(readFileSync(filePath, 'utf-8'));

    console.log(`Loaded ${payments.length} payments from parsed data\n`);
    console.log('Starting import...\n');

    let importedCount = 0;
    let errorCount = 0;

    for (const payment of payments) {
        try {
            const personId = payment.person === 'Than' ? thanId : quangId;

            // Create debt (as receipt)
            const debtRef = await addDoc(collection(db, 'debts'), {
                name: payment.debtName,
                balance: payment.amount,
                dueDate: payment.date,
                personId: personId,
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

            importedCount++;
            if (importedCount % 10 === 0) {
                console.log(`Progress: ${importedCount}/${payments.length} payments imported...`);
            }

        } catch (error) {
            console.error(`✗ Failed to import line ${payment.lineNumber}: ${payment.debtName}`, error.message);
            errorCount++;
        }
    }

    console.log('\n=== Import Complete ===');
    console.log(`✓ Successfully imported: ${importedCount} payments`);
    console.log(`✗ Failed: ${errorCount} payments`);
    console.log(`\nThan: ${payments.filter(p => p.person === 'Than').length} payments`);
    console.log(`Quang: ${payments.filter(p => p.person === 'Quang').length} payments`);
}

// Run import
importArchiveData()
    .then(() => {
        console.log('\n✓ Import script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n✗ Import script failed:', error);
        process.exit(1);
    });
