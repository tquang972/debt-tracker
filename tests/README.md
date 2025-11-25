# Debt Tracker Regression Tests

## Running Tests

1. **Local Testing**:
   - Open `regression-tests.html` in your browser
   - Tests will run automatically after 2 seconds
   - View results in the browser

2. **Live Site Testing**:
   - Navigate to: https://tquang972.github.io/debt-tracker/tests/regression-tests.html
   - Tests will run against live data

## Test Suites

### 1. Store Initialization
- Verifies all store methods exist
- Checks CRUD operations availability

### 2. Data Filtering
- Tests debt filtering (balance >= 0.01)
- Validates active vs all debts

### 3. Payment Operations
- Verifies payment retrieval
- Checks payment sorting (newest first)

### 4. User Management
- Validates current user ID
- Checks people array

### 5. Balance Calculations
- Ensures all balances are numeric
- Verifies non-negative balances

### 6. Date Handling
- Validates debt due dates
- Checks payment dates

### 7. Data Integrity
- Verifies required fields on debts
- Validates required fields on payments
- Ensures payment-debt relationships

## Adding New Tests

When adding new features, add corresponding tests to `regression-tests.html`:

```javascript
// Test Suite N: Feature Name
results.innerHTML += '<div class="test-suite"><h2>Feature Name</h2></div>';

assert(condition, 'Test description');
assertEquals(actual, expected, 'Test description');
```

## Expected Results

All tests should pass (100% success rate) before deploying new features.
