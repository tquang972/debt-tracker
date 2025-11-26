# Release Notes v1.2.5

## New Features
- **Analytics Payment Details**: Added expandable payment list to the Analytics chart. Users can now click on any month's bar to see a detailed breakdown of payments for that month, including date, debt name, and amount.

## Data Import
- **Archive History Import**: Successfully imported 255 historical payment records from the 2025 archive file.
    - All imported payments are tagged with `[I]` for easy identification.
    - Full comment strings (including calculations and notes) are preserved.
    - Corresponding debt records are created but hidden from the "Upcoming Debts" list (balance set to 0) to maintain history without cluttering the active view.

## Technical Improvements
- **Parser Enhancements**: Improved the archive data parser to correctly capture full comment strings and handle various line formats.
- **Import Logic**: Refined import logic to ensure debts are correctly linked to payments and hidden from the active list.
- **Verification**: Added verification scripts to ensure data integrity during import.

## Bug Fixes
- Fixed an issue where imported debts were being deleted, causing them to disappear from the History view. Now they are kept with a 0 balance.
