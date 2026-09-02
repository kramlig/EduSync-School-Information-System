# Contributing to EduSync

Thank you for interest in EduSync! This guide will help you get started contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Help others learn and grow
- Report issues privately if security-related

## Getting Started

### 1. Fork & Clone

\\\ash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/edusync-sis.git
cd edusync-sis
git remote add upstream https://github.com/markgildotillos/edusync-sis.git
\\\

### 2. Set Up Development Environment

\\\ash
# Install dependencies
npm install

# Create .env.local (see README for instructions)
cp .env.example .env.local

# Start development server
npm run dev:emu
\\\

### 3. Create a Feature Branch

\\\ash
git checkout -b feature/your-feature-name
\\\

**Branch naming convention:**
- \eature/add-student-reports\ - New feature
- \ix/grading-bug\ - Bug fix
- \docs/update-readme\ - Documentation
- \	est/improve-coverage\ - Tests

## Making Changes

### Code Style

- **TypeScript:** Use strict mode, avoid any
- **React:** Functional components with hooks
- **Formatting:** Prettier (auto-formats on save)
- **Linting:** ESLint (configured in project)

### Testing

Before submitting a PR:

\\\ash
# Run tests
npm run test:e2e

# Run security tests
npm run test:security

# Verify build
npm run build:prod
\\\

### Commit Messages

Follow conventional commits:

\\\
feat: add new grading dashboard
fix: resolve student enrollment bug
docs: update deployment guide
test: add E2E tests for login
refactor: reorganize components folder
\\\

## Submitting a Pull Request

### Before Submitting

1. **Sync with upstream:**
   \\\ash
   git fetch upstream
   git rebase upstream/main
   \\\

2. **Run tests:**
   \\\ash
   npm run test:e2e
   npm run test:security
   \\\

3. **Verify build:**
   \\\ash
   npm run build:prod
   \\\

### PR Template

\\\markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added
- [ ] E2E tests added
- [ ] Manual testing done

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guide
- [ ] No console.log or debug code
- [ ] No secrets in code
- [ ] Tests pass
- [ ] Documentation updated
\\\

## Development Commands

\\\ash
# Start with emulator
npm run dev:emu

# Start with production Firebase
npm run dev:prod

# Run tests
npm run test:e2e
npm run test:security

# Build for production
npm run build:prod

# Format code
npm run format (if configured)

# Lint code
npm run lint (if configured)
\\\

## Project Structure

\\\
src/
  ├── components/     # React components
  ├── pages/          # Page-level components
  ├── hooks/          # Custom React hooks
  ├── services/       # Firebase, API services
  ├── utils/          # Helper functions
  ├── types/          # TypeScript types
  └── App.tsx         # Main app component

docs/
  ├── ARCHITECTURE.md # System design
  ├── DEPLOYMENT.md   # Deployment guide
  └── CONTRIBUTING.md # This file

scripts/
  ├── seed-*.cjs      # Database seeding
  ├── migrate-*.cjs   # Migrations
  └── test-*.cjs      # Testing utilities
\\\

## Common Issues & Solutions

### Issue: Firestore Emulator Won't Start
\\\ash
# Kill existing emulator
npm run emu:kill

# Clear state and restart
rm -rf .firebase
npm run dev:emu
\\\

### Issue: TypeScript Errors
\\\ash
# Regenerate types from Firestore
npm run update:types

# Or manually check tsconfig.json
\\\

### Issue: Tests Fail Locally
\\\ash
# Make sure emulator is running
npm run emu:up

# Run tests in separate terminal
npm run test:e2e

# Or run with verbose output
npm run test:e2e -- --verbose
\\\

## Performance Considerations

When adding features:
- [ ] No N+1 database queries
- [ ] Use batch operations for multiple Firestore writes
- [ ] Lazy load heavy components
- [ ] Optimize images before committing
- [ ] Check bundle size: \
pm run build:prod --analyze\

## Security Considerations

- [ ] Never commit .env.local or secrets
- [ ] Use Firebase Security Rules for access control
- [ ] Validate all user input
- [ ] Sanitize output for XSS prevention
- [ ] Use parameterized queries (if using SQL)

## Documentation

When adding features:
1. Add JSDoc comments to functions
2. Update relevant docs/ files
3. Add examples in README if applicable
4. Include architecture decision if major change

## Review Process

1. **Automated checks:**
   - GitHub Actions runs tests
   - Linting/formatting verified

2. **Code review:**
   - Maintainer reviews for quality
   - Security review if needed
   - Performance check if relevant

3. **Approval & Merge:**
   - Once approved, maintainer will merge
   - Changes deployed to staging
   - Production deployment on next release

## Recognition

- All contributors listed in CONTRIBUTORS.md
- Major contributors get co-author commit credit
- Active contributors may become maintainers

## Questions?

- Open an issue for questions
- Check existing issues first
- Ask in discussions tab
- Email: mg.dotillos@fujitsu.com

---

Thank you for contributing to EduSync!
