/**
 * Cleanup Script - Delete Imported Data
 * 
 * This script deletes all debts and payments that have "[I]" in their note.
 * Used to revert the database to a clean state after a test import.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

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

async function cleanupImportedData() {
    console.log('=== Cleanup Imported Data ===\n');

    // 1. Find all payments with [I] tag
    console.log('Finding imported payments...');
    const paymentsRef = collection(db, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);

    const importedPayments = [];
    paymentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.note && data.note.includes('[I]')) {
            importedPayments.push({ id: doc.id, ...data });
        }
    });

    console.log(`Found ${importedPayments.length} imported payments.`);

    // 2. Find all debts with [I] tag
    console.log('Finding imported debts...');
    const debtsRef = collection(db, 'debts');
    const debtsSnapshot = await getDocs(debtsRef);

    const importedDebts = [];
    debtsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.note && data.note.includes('[I]')) {
            importedDebts.push({ id: doc.id, ...data });
        }
    });

    console.log(`Found ${importedDebts.length} imported debts.`);

    if (importedPayments.length === 0 && importedDebts.length === 0) {
        console.log('\nNothing to clean up.');
        return;
    }

    console.log('\nDeleting items...');

    // Delete payments
    let deletedPayments = 0;
    for (const payment of importedPayments) {
        await deleteDoc(doc(db, 'payments', payment.id));
        deletedPayments++;
        if (deletedPayments % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n✓ Deleted ${deletedPayments} payments`);

    // Delete debts
    let deletedDebts = 0;
    for (const debt of importedDebts) {
        await deleteDoc(doc(db, 'debts', debt.id));
        deletedDebts++;
        if (deletedDebts % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n✓ Deleted ${deletedDebts} debts`);

    console.log('\n=== Cleanup Complete ===');
}

cleanupImportedData()
    .then(() => {
        console.log('✓ Cleanup script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('✗ Cleanup script failed:', error);
        process.exit(1);
    });
