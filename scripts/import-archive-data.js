/**
 * Archive Data Import Script
 * 
 * This script imports historical payment data from the archive file into Firebase.
 * Each payment creates:
 * 1. A debt record (as a receipt)
 * 2. A payment record for the same amount (so balance = 0)
 * 
 * All imported records are tagged with [IMPORTED] in the note field.
 */

import { db } from './firebase-config.js';

// Get person IDs from Firestore
async function getPersonIds() {
    const peopleSnapshot = await db.collection('people').get();
    const people = {};
    peopleSnapshot.forEach(doc => {
        people[doc.data().name] = doc.id;
    });
    return people;
}

// Parse date in M/D format to YYYY-MM-DD (assumes 2025)
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Handle formats like "10/22", "9/1", etc.
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (!match) return null;

    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    return `2025-${month}-${day}`;
}

// Extract amount from text
function extractAmount(text) {
    // Look for amount after "=" (for calculations)
    const calcMatch = text.match(/=\s*\$?([0-9,]+\.?\d*)/);
    if (calcMatch) {
        return parseFloat(calcMatch[1].replace(/,/g, ''));
    }

    // Look for amount before "due"
    const dueMatch = text.match(/\$?([0-9,]+\.?\d*)\s*(?:due|paid|\d{1,2}\/\d{1,2})/);
    if (dueMatch) {
        return parseFloat(dueMatch[1].replace(/,/g, ''));
    }

    return null;
}

// Extract debt name (text before the amount)
function extractDebtName(text) {
    // Remove leading dash and whitespace
    text = text.replace(/^-\s*/, '');

    // Extract text before the first number or colon
    const match = text.match(/^([^:$0-9]+)/);
    if (match) {
        return match[1].trim();
    }

    return 'Unknown Debt';
}

// Extract comment (everything in parentheses + calculations)
function extractComment(text) {
    const comments = [];

    // Extract calculation if exists
    const calcMatch = text.match(/([0-9+\-*/.() ]+)=/);
    if (calcMatch) {
        comments.push(`Calculation: ${calcMatch[1].trim()}`);
    }

    // Extract text in parentheses
    const parenMatches = text.match(/\(([^)]+)\)/g);
    if (parenMatches) {
        parenMatches.forEach(match => {
            const content = match.replace(/[()]/g, '').trim();
            if (content) comments.push(content);
        });
    }

    return comments.length > 0 ? `[IMPORTED] ${comments.join(' | ')}` : '[IMPORTED]';
}

// Extract date from text
function extractDate(text) {
    // Look for "due M/D" or "paid M/D"
    const dueMatch = text.match(/(?:due|paid)\s+(\d{1,2}\/\d{1,2})/);
    if (dueMatch) {
        return parseDate(dueMatch[1]);
    }

    // Look for standalone date at end
    const endMatch = text.match(/(\d{1,2}\/\d{1,2})\s*$/);
    if (endMatch) {
        return parseDate(endMatch[1]);
    }

    return null;
}

// Parse a single payment line
function parsePaymentLine(line, personId) {
    if (!line.trim().startsWith('-')) return null;

    const debtName = extractDebtName(line);
    const amount = extractAmount(line);
    const date = extractDate(line);
    const note = extractComment(line);

    if (!amount || !date) {
        console.warn('Skipping line (missing amount or date):', line);
        return null;
    }

    return {
        debtName,
        amount,
        date,
        note,
        personId
    };
}

// Main import function
async function importArchiveData() {
    console.log('Starting archive data import...');

    // Get person IDs
    const people = await getPersonIds();
    const thanId = people['Than'];
    const quangId = people['Quang'];

    if (!thanId || !quangId) {
        throw new Error('Could not find Than or Quang in people collection');
    }

    console.log('Person IDs:', { thanId, quangId });

    // Read the archive file (you'll need to paste the data here or read from file)
    const archiveData = `
    // PASTE ARCHIVE DATA HERE
    `;

    const lines = archiveData.split('\n');
    let currentPerson = null;
    let importedCount = 0;
    let skippedCount = 0;

    for (const line of lines) {
        // Check for person section headers
        if (line.includes('-----Than-----')) {
            currentPerson = thanId;
            continue;
        }
        if (line.includes('-----Quang-----')) {
            currentPerson = quangId;
            continue;
        }

        // Skip non-payment lines
        if (!line.trim().startsWith('-')) continue;

        // Parse payment
        const payment = parsePaymentLine(line, currentPerson);
        if (!payment) {
            skippedCount++;
            continue;
        }

        try {
            // Create debt (as receipt)
            const debtRef = await db.collection('debts').add({
                name: payment.debtName,
                balance: payment.amount,
                dueDate: payment.date,
                personId: payment.personId,
                note: payment.note,
                createdAt: new Date().toISOString()
            });

            // Create payment (to zero out the debt)
            await db.collection('payments').add({
                debtId: debtRef.id,
                amount: payment.amount,
                date: payment.date,
                note: payment.note,
                createdAt: new Date().toISOString()
            });

            importedCount++;
            console.log(`✓ Imported: ${payment.debtName} - $${payment.amount} (${payment.date})`);

        } catch (error) {
            console.error(`✗ Failed to import: ${payment.debtName}`, error);
            skippedCount++;
        }
    }

    console.log('\n=== Import Complete ===');
    console.log(`Imported: ${importedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

// Run import
importArchiveData().catch(console.error);
