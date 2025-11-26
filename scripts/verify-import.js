/**
 * Verify Import Script
 * 
 * Checks Firestore to confirm that all 255 payments have been imported correctly.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function verifyImport() {
    console.log('=== Verifying Import ===\n');

    console.log('Fetching payments from Firestore...');
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    const payments = [];
    paymentsSnapshot.forEach(doc => {
        payments.push({ id: doc.id, ...doc.data() });
    });

    const importedPayments = payments.filter(p => p.note && p.note.includes('[I]'));

    console.log(`Total payments in DB: ${payments.length}`);
    console.log(`Imported payments ([I] tag): ${importedPayments.length}`);
    console.log(`Expected imported count: 255`);

    if (importedPayments.length === 255) {
        console.log('\n✓ Verification SUCCESS: Count matches!');
    } else {
        console.error(`\n✗ Verification FAILED: Count mismatch! Expected 255, found ${importedPayments.length}`);
        process.exit(1);
    }
}

verifyImport()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('✗ Verification script failed:', error);
        process.exit(1);
    });
