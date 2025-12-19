# Future Development

## Deployment Checklist (Added Dec 2024)

Before merging any feature branch to `main`:

### 1. Dependency Audit
- [ ] Verify all HTML entry points have required libraries
  - `index.html` - Main app (requires: Firebase App, Auth, Firestore)
  - `login.html` - Authentication (requires: Firebase App, Auth, Firestore)
- [ ] Check cache-busting parameters are consistent across all pages
- [ ] Ensure Service Worker cache version is bumped

### 2. Critical User Flow Testing
- [ ] Test login flow (both success and failure cases)
- [ ] Test main app functionality after login
- [ ] Test logout and re-login
- [ ] Verify PWA install and offline functionality
- [ ] Test on mobile viewport

### 3. Cross-Page Consistency
- [ ] Verify theme consistency across all pages
- [ ] Check that all pages load the same Firebase SDK versions
- [ ] Ensure all module imports use cache-busting if implemented

### 4. Post-Deployment Verification
- [ ] Test on GitHub Pages (production environment)
- [ ] Clear browser cache and test fresh load
- [ ] Verify Service Worker updates correctly

## Lessons Learned

### v1.5.0 Login Issue (Dec 2024)
**Problem**: After deploying UI redesign, login page failed with `firebase.firestore is not a function`.

**Root Cause**: `login.html` was missing `firebase-firestore-compat.js` script tag. During cache-busting implementation, focus was on `index.html` and `js/app.js`, but `login.html` dependencies weren't systematically verified.

**Prevention**:
1. Maintain a dependency matrix for all HTML entry points
2. Test all critical user flows before merging to main
3. Use the deployment checklist above for every release

---

## Feature Requests
- add analytics for future months payment[done]
- add graphics
- add drop down from analytics to see all payments[done]
- combine Debt tab with overview tab[done]
- show due date and paid date in history[done]
- [x] Add Log in to access backend data[done]
- Implement Color like Robinhood Credit card app
### High Priority
- [ ] 

### Medium Priority
- [ ] 

### Low Priority
- [ ] 

---

## Bug Reports

### Critical
- [ ] 

### Non-Critical
- [ ] 

---

## Technical Debt

- [ ] Refine Firestore security rules (currently permissive)
- [ ] Replace placeholder icons with final designs
- [ ] 

---

## Performance Improvements

- [ ] 

---

## UI/UX Enhancements

- [ ] 

---

## Notes

### Development Guidelines
- Always follow the V-Model process (see `/docs/V-MODEL.md`)
- Use `/debug-ui-issues` workflow for UI bugs
- Develop on `dev` branch, merge to `main` only after full testing
- Run regression tests before merging (`/tests/regression-tests.html`)

### Useful Commands
```bash
# Switch to dev branch
git checkout dev

# Run local server (if needed)
npx http-server -p 8080

# Deploy to GitHub Pages (automatic on push to main)
git push origin main
```

### Important Files
- `/docs/V-MODEL.md` - Development process
- `/docs/BRANCHING.md` - Git workflow
- `/docs/POST_MORTEM.md` - Lessons learned from incidents
- `/.agent/workflows/debug-ui-issues.md` - UI debugging workflow
- `/tests/regression-tests.html` - Regression test suite
