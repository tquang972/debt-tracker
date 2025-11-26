# Archive Data Import - README

## Overview

This directory contains scripts to import historical payment data from 2025 into the Debt Tracker app.

## Files

- **`parse-archive-data.js`** - Parses the archive markdown file into JSON
- **`import-to-firebase.js`** - Imports the parsed data into Firebase Firestore
- **`../data/parsed-archive-data.json`** - Parsed payment data (255 payments)

## Import Status

✅ **Parsing Complete:** 255 payments successfully parsed (100% success rate)
- Than: 104 payments
- Quang: 151 payments

⚠️ **Import Status:** NOT YET RUN

## How to Run the Import

### Prerequisites

1. Make sure you're on the `feature/importing-archive-data` branch
2. Install Firebase SDK if not already installed:
   ```bash
   npm install firebase
   ```

### Step 1: Review Parsed Data (Optional)

```bash
# View first 5 payments
cat data/parsed-archive-data.json | jq '.[0:5]'

# Count by person
cat data/parsed-archive-data.json | jq 'group_by(.person) | map({person: .[0].person, count: length})'
```

### Step 2: Run the Import

**⚠️ WARNING: This will add 255 debts + 255 payments to your Firebase database. Run this ONCE only!**

```bash
node scripts/import-to-firebase.js
```

### Step 3: Verify in the App

1. Open https://tquang972.github.io/debt-tracker/
2. Go to **History** tab
3. Look for payments with `[I]` tag in the notes
4. Verify counts match:
   - Total payments should increase by 255
   - All imported payments should have balance = $0.00

## What the Import Does

For each of the 255 payments:

1. **Creates a Debt** with:
   - Name: e.g., "KC Water", "Honda Payment"
   - Balance: Original amount
   - Due Date: Payment date
   - Person: Than or Quang
   - Note: `[I] ...` (calculation details, payment method, etc.)

2. **Creates a Payment** with:
   - Same amount as the debt
   - Same date
   - Same note
   - Links to the debt (so balance becomes $0)

## Rollback (If Needed)

If you need to undo the import:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Filter payments by note containing `[I]`
4. Delete all imported records

Or use a script to delete all records with `[I]` tag.

## Notes

- All imported records are tagged with `[I]` to distinguish them from regular entries
- Imported debts will appear in **History** tab (not Upcoming, since balance = 0)
- The import preserves all original dates from 2025
- Calculations and payment methods are preserved in the note field

## Troubleshooting

**Error: "Could not find Than or Quang"**
- Make sure the people collection in Firebase has users named exactly "Than" and "Quang"

**Error: Permission denied**
- Check Firebase security rules
- Make sure you're authenticated

**Duplicate entries**
- The script does NOT check for duplicates
- If you run it twice, you'll get 510 payments instead of 255
- Delete duplicates manually or restore from backup
