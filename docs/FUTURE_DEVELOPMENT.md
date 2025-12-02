# Future Development Ideas

## Feature Requests
- add analytics for future months payment[done]
- add graphics
- add drop down from analytics to see all payments[done]
- combine Debt tab with overview tab[done]
- show due date and paid date in history
- Add Log in to access backend data
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
