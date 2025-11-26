/**
 * Archive Data Import Script - Step 1: Parse and Preview
 * 
 * This script parses the archive file and shows you what will be imported
 * BEFORE actually writing to Firebase.
 * 
 * Run this first to review the parsed data, then run the actual import.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse date in M/D format to YYYY-MM-DD (assumes 2025)
function parseDate(dateStr) {
    if (!dateStr) return null;

    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (!match) return null;

    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    return `2025-${month}-${day}`;
}

// Extract amount from text
function extractAmount(text) {
    // Special case for Line 4: "Dad owns Quang: 3000 (paid 703 after 2297 offset on 10/22)"
    if (text.includes('Dad owns Quang') && text.includes('3000')) {
        return 3000;
    }

    // Skip if line is just a calculation (number - number without other context)
    // e.g., "- 1251 -1413.33(1/22)" should be skipped
    if (text.match(/^\\?-\s*\d+\s*-\s*\d+/)) {
        return null;
    }

    // Look for amount after "=" (for calculations)
    const calcMatch = text.match(/=\s*\$?([0-9,]+\.?\d*)/);
    if (calcMatch) {
        return parseFloat(calcMatch[1].replace(/,/g, ''));
    }

    // Look for subtraction (e.g., "1,446.44 -1.87") - but only if there's context before it
    const subMatch = text.match(/:\s*\$?([0-9,]+\.?\d*)\s*-\s*([0-9,]+\.?\d*)/);
    if (subMatch) {
        const num1 = parseFloat(subMatch[1].replace(/,/g, ''));
        const num2 = parseFloat(subMatch[2].replace(/,/g, ''));
        return num1 - num2;
    }

    // Look for amount before "due" or "paid"
    const dueMatch = text.match(/\$?([0-9,]+\.?\d*)\s*(?:due|paid)/);
    if (dueMatch) {
        return parseFloat(dueMatch[1].replace(/,/g, ''));
    }

    // Look for "$XXX" pattern (e.g., "$400", "$170", "$5")
    const dollarMatch = text.match(/\$([0-9,]+\.?\d*)/);
    if (dollarMatch) {
        return parseFloat(dollarMatch[1].replace(/,/g, ''));
    }

    // Look for amount followed by date
    const dateMatch = text.match(/\b([0-9,]+\.?\d*)\s+\d{1,2}\/\d{1,2}/);
    if (dateMatch) {
        return parseFloat(dateMatch[1].replace(/,/g, ''));
    }

    // Look for amount in parentheses (e.g., "326.14(personal loan-5k)")
    const parenMatch = text.match(/:\s*([0-9,]+\.?\d*)\(/);
    if (parenMatch) {
        return parseFloat(parenMatch[1].replace(/,/g, ''));
    }

    // Look for first amount after colon (e.g., "Bus: 2684.33 - 1251...")
    const firstAmountMatch = text.match(/:\s*([0-9,]+\.?\d*)/);
    if (firstAmountMatch) {
        return parseFloat(firstAmountMatch[1].replace(/,/g, ''));
    }

    // Look for amount before text (e.g., "830 tci trip")
    const beforeTextMatch = text.match(/\b([0-9,]+\.?\d*)\s+[a-z]/i);
    if (beforeTextMatch) {
        return parseFloat(beforeTextMatch[1].replace(/,/g, ''));
    }

    return null;
}

// Extract debt name
function extractDebtName(text) {
    // Remove leading dash (both - and \-) and whitespace
    text = text.replace(/^\\?-\s*/, '').trim();

    // Extract text before colon or first number
    const match = text.match(/^([^:$0-9]+)/);
    if (match) {
        return match[1].trim();
    }

    return 'Unknown Debt';
}

// Extract comment
function extractComment(text) {
    const comments = [];

    // Extract calculation if exists
    const calcMatch = text.match(/([0-9+\-*/.(), ]+)=/);
    if (calcMatch) {
        comments.push(`Calc: ${calcMatch[1].trim()}`);
    }

    // Extract subtraction
    const subMatch = text.match(/([0-9,]+\.?\d*)\s*-\s*([0-9,]+\.?\d*)/);
    if (subMatch) {
        comments.push(`Calc: ${subMatch[0]}`);
    }

    // Extract text in parentheses
    const parenMatches = text.match(/\(([^)]+)\)/g);
    if (parenMatches) {
        parenMatches.forEach(match => {
            const content = match.replace(/[()]/g, '').trim();
            if (content && !content.match(/^\d{1,2}\/\d{1,2}$/)) {
                comments.push(content);
            }
        });
    }

    return comments.length > 0 ? `[I] ${comments.join(' | ')}` : '[I]';
}

// Extract date
function extractDate(text) {
    // Special case for Line 4: "paid 703 after 2297 offset on 10/22"
    if (text.includes('Dad owns Quang') && text.includes('10/22')) {
        return parseDate('10/22');
    }

    // Look for "due M/D" or "paid M/D"
    const dueMatch = text.match(/(?:due|paid)\s+(\d{1,2}\/\d{1,2})/);
    if (dueMatch) {
        return parseDate(dueMatch[1]);
    }

    // Look for "on M/D"
    const onMatch = text.match(/\son\s+(\d{1,2}\/\d{1,2})/);
    if (onMatch) {
        return parseDate(onMatch[1]);
    }

    // Look for standalone date at end
    const endMatch = text.match(/(\d{1,2}\/\d{1,2})\s*$/);
    if (endMatch) {
        return parseDate(endMatch[1]);
    }

    // Look for date in middle (e.g., "10/5")
    const midMatch = text.match(/\s(\d{1,2}\/\d{1,2})\s/);
    if (midMatch) {
        return parseDate(midMatch[1]);
    }

    return null;
}

// Parse archive file
function parseArchiveFile() {
    const filePath = join(__dirname, '../data/[ARCHIVE] HISTORY SPENDING 2025.md');
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let currentPerson = null;
    const payments = [];
    const skippedLines = [];
    let lineNumber = 0;

    for (const line of lines) {
        lineNumber++;

        // Check for person section headers (format: -----Than----- or -----Quang-----)
        if (line.includes('Than') && line.includes('---')) {
            currentPerson = 'Than';
            console.log(`Found Than section at line ${lineNumber}`);
            continue;
        }
        if (line.includes('Quang') && line.includes('---')) {
            currentPerson = 'Quang';
            console.log(`Found Quang section at line ${lineNumber}`);
            continue;
        }

        // Skip non-payment lines (only \- marks a new payment)
        const trimmed = line.trim();
        if (!trimmed.startsWith('\\-')) continue;
        if (!currentPerson) continue;

        const debtName = extractDebtName(line);
        const amount = extractAmount(line);
        const date = extractDate(line);
        const note = extractComment(line);

        if (!amount || !date) {
            const reason = !amount ? 'missing amount' : 'missing date';
            skippedLines.push({
                lineNumber,
                person: currentPerson,
                reason,
                line: line.substring(0, 100)
            });
            continue;
        }

        payments.push({
            lineNumber,
            person: currentPerson,
            debtName,
            amount,
            date,
            note,
            originalLine: line.substring(0, 80)
        });
    }

    return { payments, skippedLines };
}

// Main function
console.log('=== Archive Data Parser ===\n');

const { payments, skippedLines } = parseArchiveFile();

console.log(`Total payments parsed: ${payments.length}\n`);

// Show first 10 as preview
console.log('Preview (first 10):');
console.log('-------------------');
payments.slice(0, 10).forEach(p => {
    console.log(`Line ${p.lineNumber} | ${p.person} | ${p.debtName} | $${p.amount} | ${p.date}`);
    console.log(`  Note: ${p.note}`);
    console.log(`  Original: ${p.originalLine}`);
    console.log('');
});

// Summary by person
const thanPayments = payments.filter(p => p.person === 'Than');
const quangPayments = payments.filter(p => p.person === 'Quang');

console.log('\n=== Summary ===');
console.log(`Than: ${thanPayments.length} payments`);
console.log(`Quang: ${quangPayments.length} payments`);
console.log(`Total: ${payments.length} payments`);
console.log(`Skipped: ${skippedLines.length} lines`);

// Show all skipped lines
if (skippedLines.length > 0) {
    console.log('\n=== Skipped Lines (for cleanup) ===');
    skippedLines.forEach(s => {
        console.log(`Line ${s.lineNumber} (${s.person}) - ${s.reason}:`);
        console.log(`  ${s.line}`);
    });
}

// Save parsed data to JSON for review
import { writeFileSync } from 'fs';
writeFileSync(
    join(__dirname, '../data/parsed-archive-data.json'),
    JSON.stringify(payments, null, 2)
);

console.log('\n✓ Parsed data saved to: data/parsed-archive-data.json');
console.log('\nReview the JSON file, then run the import script to add to Firebase.');
