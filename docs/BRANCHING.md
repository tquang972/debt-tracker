# Git Branching Strategy

## Branch Structure

### `main` - Production Branch
- **Purpose**: Stable, production-ready code
- **Deployment**: Automatically deployed to https://tquang972.github.io/debt-tracker/
- **Updates**: Only via Pull Request from `dev` after full testing
- **Protection**: Should be protected (no direct commits)

### `dev` - Development Branch
- **Purpose**: Active development and testing
- **Deployment**: Can be tested at https://tquang972.github.io/debt-tracker/?branch=dev (if configured)
- **Updates**: Direct commits during development
- **Testing**: All V-Model tests must pass before merging to `main`

## Workflow

### 1. Development Phase
```bash
# Ensure you're on dev branch
git checkout dev

# Make changes
# ... code changes ...

# Commit with V-Model standards
git add .
git commit -m "[Type] Description

Code Review: ...
Tests: ...
Regression: ...

Changes: ..."

# Push to dev
git push origin dev
```

### 2. Testing Phase
- Run unit tests: `/tests/unit/`
- Run integration tests: `/tests/integration/`
- Run regression tests: `/tests/regression-tests.html`
- Verify all tests pass (100%)

### 3. Merge to Production
```bash
# Ensure dev is up to date
git checkout dev
git pull origin dev

# Switch to main
git checkout main
git pull origin main

# Merge dev into main
git merge dev

# Push to production
git push origin main
```

### 4. Post-Merge
```bash
# Switch back to dev for next feature
git checkout dev
```

## GitHub Pages Configuration

### Option 1: Main Branch Only (Current)
- GitHub Pages serves from `main` branch
- Users always see stable version

### Option 2: Branch-Based Testing (Recommended)
- Main: https://tquang972.github.io/debt-tracker/
- Dev: https://tquang972.github.io/debt-tracker/dev/ (requires gh-pages setup)

## Pull Request Template

When merging `dev` → `main`, create PR with:

```markdown
## Changes
- [List of features/fixes]

## Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Regression tests pass (100%)
- [ ] Manual testing completed

## Code Review
- [ ] Code follows project standards
- [ ] No console errors
- [ ] Documentation updated
- [ ] Version number bumped

## Deployment Checklist
- [ ] All tests passing
- [ ] No breaking changes
- [ ] User acceptance complete
```

## Emergency Hotfix Workflow

For critical production bugs:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/description

# Fix the issue
# ... code changes ...

# Test thoroughly
# Run all tests

# Merge to main
git checkout main
git merge hotfix/description
git push origin main

# Merge to dev to keep in sync
git checkout dev
git merge hotfix/description
git push origin dev

# Delete hotfix branch
git branch -d hotfix/description
```

## Current Branch Status

- ✅ `main`: Production (stable)
- ✅ `dev`: Development (active)

## Best Practices

1. **Never commit directly to `main`**
2. **Always develop on `dev`**
3. **Merge to `main` only after full V-Model testing**
4. **Keep `dev` and `main` in sync**
5. **Use descriptive commit messages**
6. **Tag releases on `main`**: `git tag v1.0.5`
