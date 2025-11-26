# Regression Testing Checklist

**Purpose:** Manual testing checklist to verify all features work correctly before merging to `main` for release.

---

## Pre-Merge Testing Checklist

### ✅ Core Features

#### Dashboard
- [ ] Dashboard loads without errors
- [ ] "Upcoming Debts" section shows debts with balance >= $0.01
- [ ] Debts are sorted by due date (earliest first)
- [ ] Total amount owed is calculated correctly
- [ ] "View All Debts" button navigates to Debts tab

#### Debts Tab
- [ ] All debts list loads correctly
- [ ] Only debts with balance >= $0.01 are shown
- [ ] "+" button opens Add Debt modal
- [ ] Each debt card shows: name, amount, due date, person
- [ ] "Pay" button opens payment modal
- [ ] "Edit" button opens edit modal
- [ ] "Delete" button deletes debt (with confirmation)

#### History Tab
- [ ] All payments are listed (including soft-deleted)
- [ ] Payments are sorted by date (newest first)
- [ ] Each payment shows: debt name, amount, date, note
- [ ] "Edit" button opens edit payment modal
- [ ] "Delete" button soft-deletes payment
- [ ] Deleted payments show "Restore" and "Permanent Delete" options

#### Analytics Tab
- [ ] Total paid amount is calculated correctly
- [ ] Payment count is accurate
- [ ] Average payment is calculated correctly
- [ ] Charts/stats update when payments change

#### Settings Tab
- [ ] User list loads correctly
- [ ] Can switch between users
- [ ] Current user is highlighted
- [ ] Data filters correctly when switching users

---

### ✅ Payment Flow

#### Making a Payment
- [ ] Click "Pay" opens modal
- [ ] Modal shows correct debt name
- [ ] Amount field pre-fills with debt balance
- [ ] Date field shows **today's date in CT timezone** (not tomorrow)
- [ ] "Populate next month's debt?" checkbox is checked by default
- [ ] "Cancel" button closes modal without saving
- [ ] "Confirm Payment" button:
  - [ ] Saves payment to History
  - [ ] Updates debt balance
  - [ ] Removes debt from Upcoming if fully paid
  - [ ] Creates next month's debt if checkbox is checked
  - [ ] **Modal closes immediately** (no duplicate modals)
  - [ ] **No page reload** (URL stays clean, no query parameters)

#### Recurring Debt Date Calculation
- [ ] If original debt due date is `2025-11-25`, next month debt is `2025-12-25` (not `2025-12-24`)
- [ ] Date calculation works correctly in CT timezone
- [ ] Handles month rollover (e.g., Jan 31 → Feb 28/29)

---

### ✅ Data Integrity

#### Debt Management
- [ ] Can add new debt with all required fields
- [ ] Can edit existing debt
- [ ] Can delete debt
- [ ] Debt balance updates correctly after payment
- [ ] Debts with balance < $0.01 disappear from Upcoming

#### Payment Management
- [ ] Can add payment
- [ ] Can edit payment
- [ ] Can soft-delete payment (appears in History with "Restore" option)
- [ ] Can restore soft-deleted payment
- [ ] Can permanently delete payment
- [ ] Editing payment updates debt balance correctly

#### User Switching
- [ ] Switching users shows only that user's debts
- [ ] Switching users shows only that user's payments
- [ ] Data doesn't leak between users

---

### ✅ UI/UX

#### Modals
- [ ] Only ONE modal appears at a time (no duplicates)
- [ ] Modals close when clicking "Cancel"
- [ ] Modals close when clicking "Confirm" (after successful save)
- [ ] Modal backdrop prevents clicking background
- [ ] Modals are centered and visible

#### Forms
- [ ] Required fields show validation errors
- [ ] Date fields accept valid dates
- [ ] Number fields accept valid numbers
- [ ] Form submission doesn't cause page reload

#### Navigation
- [ ] All tabs are clickable
- [ ] Active tab is highlighted
- [ ] Tab content loads correctly
- [ ] Browser back/forward buttons work (if applicable)

---

### ✅ Timezone Handling (CT)

- [ ] Payment date defaults to **today in CT** (not UTC)
- [ ] Recurring debt due date is **exactly 1 month later in CT** (not off by 1 day)
- [ ] All dates display correctly in CT timezone

---

### ✅ Performance & Errors

#### Console
- [ ] No JavaScript errors in console
- [ ] No 404 errors for resources
- [ ] No Firebase errors

#### Loading
- [ ] Page loads within 2 seconds
- [ ] Firebase data syncs correctly
- [ ] Real-time updates work (if multiple tabs open)

#### Caching
- [ ] Version number in bottom-right shows correct version
- [ ] Hard refresh (Cmd+Shift+R) loads latest code
- [ ] Service worker updates correctly

---

### ✅ Mobile/PWA (Optional)

- [ ] App installs as PWA on mobile
- [ ] All features work on mobile
- [ ] Touch interactions work correctly
- [ ] Responsive design looks good on small screens

---

## Testing Instructions

1. **Test in Incognito Mode** - Ensures no cached code interferes
2. **Verify Version Number** - Check bottom-right corner shows expected version
3. **Test Each Feature** - Go through checklist systematically
4. **Test Edge Cases:**
   - Empty states (no debts, no payments)
   - Large numbers (balance > $10,000)
   - Past due dates
   - Future due dates
   - Same-day payments
5. **Test User Switching** - Verify data isolation between users

---

## Pass Criteria

- [ ] **All checklist items pass**
- [ ] **No console errors**
- [ ] **Version number is correct**
- [ ] **No page reloads on form submission**
- [ ] **Modals close correctly**
- [ ] **Dates are correct in CT timezone**

**If any item fails, DO NOT merge to main. Fix the issue on `dev` branch first.**

---

## Notes

- This checklist should be updated whenever new features are added
- Critical bugs found during testing should be documented in `docs/POST_MORTEM.md`
- Consider automating these tests in the future if the app grows significantly
