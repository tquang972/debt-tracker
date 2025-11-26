---
description: How to debug UI issues (modals, buttons, forms not working)
---

# Debugging UI Issues Workflow

**GOLDEN RULE: NEVER GUESS. ALWAYS ASK QUESTIONS. VERIFY WITH TOOLS.**

## Step 1: Inspect Actual State (MANDATORY)

// turbo
Use browser subagent to navigate to the live site and inspect:
```
1. Open https://tquang972.github.io/debt-tracker/?debug=true
2. Reproduce the issue
3. Inspect the DOM for:
   - Duplicate elements (e.g., count modal-overlay elements)
   - Missing elements
   - Element state (disabled, hidden, covered)
4. Check console for errors
5. Take screenshot
```

**DO NOT PROCEED TO STEP 2 UNTIL YOU HAVE INSPECTED THE ACTUAL STATE.**

## Step 2: Check Simple Issues First

Before assuming complex problems, verify:
- [ ] Are there duplicate elements? (`document.querySelectorAll('.element').length`)
- [ ] Are event listeners attached multiple times?
- [ ] Are there typos in IDs/classes?
- [ ] Is the element actually in the DOM?
- [ ] Is it a caching issue? (Test in Incognito)

## Step 3: Add Logging (If needed)

If the issue isn't obvious from Step 1-2:
```javascript
console.log('[DEBUG] Function called');
console.log('[DEBUG] Variable value:', variable);
```

## Step 4: Ask User for Info

If you still can't reproduce or understand:
- Ask user to inspect DevTools and share screenshot
- Ask user to share console logs
- Ask specific questions about what they see

## Step 5: Fix and Verify

// turbo
After fixing:
1. Use browser subagent to verify the fix on live site
2. Ask user to test in Incognito window
3. Confirm version number is correct

## Common Pitfalls to Avoid

❌ **DON'T:**
- Assume the problem is complex (async, timing, browser quirks)
- Write code without inspecting actual state first
- Guess what's happening
- Try multiple solutions without verifying assumptions

✅ **DO:**
- Use browser subagent to see actual rendered HTML
- Check for duplicates and simple issues first
- Ask questions if you don't understand
- Verify fixes with tools, not assumptions
