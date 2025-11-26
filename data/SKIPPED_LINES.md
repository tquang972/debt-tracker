# Skipped Lines - Final Review

**Parser Status:** 252 payments successfully parsed (102 Than, 150 Quang)

**Only 3 lines remaining that need manual cleanup:**

---

## Line 53 (Than) - Missing Amount
```
\-zelle QuangGold Balance & Flight for 4: 1719.69 \+ 496.44  (if Dzung take Monday off) 6/13
```

**Issue:** This is a calculation (1719.69 + 496.44) but missing the "=" and result.

**Fix:** Add `= 2216.13` after the calculation:
```
\-zelle QuangGold Balance & Flight for 4: 1719.69 \+ 496.44 = 2216.13 (if Dzung take Monday off) 6/13
```

---

## Line 105 (Than) - Calculation Result = 0
```
\- Mom's Amex Plat Bus: 2684.33  \- 1251 \-1413.33(1/22) \= 0(quang paid debt 1/17) due 1/22
```

**Issue:** This shows a calculation that results in 0 (fully paid).

**Decision:** This line is **correctly skipped** because the final amount is 0, meaning no payment was actually made by Than (Quang paid it). This should NOT be imported.

---

## Line 205 (Quang) - Missing Amount
```
\- Paid dad's insurance for april and may due 5/14
```

**Issue:** No amount specified.

**Fix:** Add the amount. Please provide the amount for this payment.

---

## Summary

- **Line 53:** Needs `= 2216.13` added
- **Line 105:** Correctly skipped (no action needed)
- **Line 205:** Needs amount added by user

After fixing Lines 53 and 205, the parser will successfully import **254 payments** total.
