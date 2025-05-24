# 🚀 CI/CD Infrastructure

This repository includes a comprehensive CI/CD infrastructure designed to prevent regressions and ensure code quality through automated testing, monitoring, and deployment processes.

## 🎯 Quick Start

### For Developers

```bash
# Setup development environment (one-time)
npm run setup-dev-env

# Validate your environment
npm run validate-env

# Run local test suite before committing
npm run test:local

# Run with E2E tests (optional)
npm run test:local -- --e2e
```

### For CI/CD

The infrastructure automatically runs on:
- ✅ **Pull Requests** - Full test suite with quality gates
- ✅ **Main Branch Pushes** - Regression detection and baseline updates
- ✅ **Scheduled Runs** - Security monitoring and dependency updates

## 📊 Status Dashboard

View real-time CI/CD health: [CI_CD_DASHBOARD.md](./CI_CD_DASHBOARD.md)

[![CI](https://github.com/owner/repo/workflows/Continuous%20Integration/badge.svg)](https://github.com/owner/repo/actions/workflows/ci.yml)
[![Regression Detection](https://github.com/owner/repo/workflows/Regression%20Detection%20%26%20Monitoring/badge.svg)](https://github.com/owner/repo/actions/workflows/regression-detection.yml)
[![Security](https://github.com/owner/repo/workflows/Dependency%20%26%20Security%20Monitoring/badge.svg)](https://github.com/owner/repo/actions/workflows/dependency-security.yml)

## 🛡️ Quality Gates

### ✅ Automated Checks

| Check | Threshold | Enforcement |
|-------|-----------|-------------|
| **Test Coverage** | 70% minimum | ❌ Blocks merge |
| **Performance Score** | 80+ Lighthouse | ❌ Blocks merge |
| **Security Vulnerabilities** | 0 critical/high | ❌ Blocks merge |
| **TypeScript Compilation** | No errors | ❌ Blocks merge |
| **Linting** | ESLint passing | ❌ Blocks merge |
| **E2E Tests** | All browsers | ❌ Blocks merge |

### 📈 Regression Detection

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Performance Degradation** | >5% score drop | 🚨 Alert + Block |
| **Coverage Regression** | >2% drop | 🚨 Alert + Block |
| **Bundle Size Increase** | >100KB | 🚨 Alert + Block |
| **Core Web Vitals** | Threshold exceeded | 🚨 Alert + Block |

## 🔄 Workflows

### 1. Continuous Integration
**File:** `.github/workflows/ci.yml`
**Triggers:** PR, Push to main/develop

- 🔍 Code quality & linting
- 🧪 Unit tests with coverage
- 🏗️ Build verification
- 🎭 E2E tests (multi-browser)
- ⚡ Performance audits
- 🔒 Security scanning
- ♿ Accessibility testing

### 2. Regression Detection
**File:** `.github/workflows/regression-detection.yml`
**Triggers:** Push to main, Daily schedule

- 📊 Performance baseline comparison
- 📈 Coverage trend analysis
- 📦 Bundle size monitoring
- 📋 Comprehensive reporting

### 3. Security & Dependencies
**File:** `.github/workflows/dependency-security.yml`
**Triggers:** Weekly schedule, Package changes

- 🔒 Vulnerability scanning
- 📦 Dependency updates
- ⚖️ License compliance
- 🏥 Dependency health

### 4. Status Dashboard
**File:** `.github/workflows/status-dashboard.yml`
**Triggers:** Workflow completion, Hourly

- 📊 Real-time health monitoring
- 🚨 Critical failure alerts
- 📈 Success rate tracking
- 📧 Notification management

## 🪝 Git Hooks (Husky)

### Pre-commit
- 🔍 Lint staged files
- 🔧 TypeScript compilation
- 🧪 Related tests execution

### Commit Message
- 📝 Conventional commit validation
- 📏 Message length limits

### Pre-push
- 🧪 Full test suite
- 📊 Coverage validation
- 🏗️ Build verification

## 🛠️ Local Development

### Environment Setup
```bash
# Install dependencies
npm install

# Setup Git hooks
npm run setup-dev-env

# Validate environment
npm run validate-env
```

### Testing Commands
```bash
# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui

# All tests
npm run test:all
npm run test:local
```

### Quality Checks
```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Security audit
npm run security:audit

# Dependency updates
npm run deps:check
npm run deps:update
```

## 📊 Monitoring & Alerts

### Health Indicators
- 🟢 **Excellent** (90%+ success rate)
- 🟡 **Good** (75-89% success rate)
- 🟠 **Warning** (50-74% success rate)
- 🔴 **Critical** (<50% success rate)

### Alert Channels
- 📧 **GitHub Issues** - Automated issue creation
- 💬 **Slack** - Real-time notifications (optional)
- 📧 **Email** - Critical alerts (optional)

### Metrics Tracked
- ✅ Build success rate
- 📊 Test coverage trends
- ⚡ Performance metrics
- 🔒 Security posture
- 📦 Dependency health

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Enhanced security
SNYK_TOKEN=your_snyk_token

# Optional: Notifications
SLACK_WEBHOOK_URL=your_slack_webhook
SENDGRID_API_KEY=your_sendgrid_key
NOTIFICATION_EMAIL=alerts@company.com
```

### Quality Thresholds
Edit these files to adjust thresholds:
- `jest.config.js` - Coverage thresholds
- `playwright.config.ts` - E2E test settings
- `.github/workflows/regression-detection.yml` - Performance thresholds

## 🚨 Troubleshooting

### Common Issues

#### ❌ Tests Failing
```bash
# Check locally
npm run test:local

# Fix linting
npm run lint -- --fix

# Check types
npx tsc --noEmit
```

#### ❌ Performance Regression
```bash
# Check Lighthouse report in Actions artifacts
# Optimize bundle size
# Review Core Web Vitals
```

#### ❌ Coverage Drop
```bash
# Run coverage report
npm run test:coverage

# Identify uncovered code
# Add missing tests
```

#### ❌ Security Vulnerabilities
```bash
# Auto-fix vulnerabilities
npm audit fix

# Check for updates
npm run deps:update

# Review security report in Actions
```

### Getting Help

1. 📊 Check [CI_CD_DASHBOARD.md](./CI_CD_DASHBOARD.md) for current status
2. 🔍 Review GitHub Actions logs
3. 📖 Read [docs/ci-cd-setup.md](./docs/ci-cd-setup.md) for detailed documentation
4. 🐛 Create an issue for persistent problems

## 📈 Best Practices

### Code Quality
- ✅ Write tests before code (TDD)
- ✅ Maintain >70% test coverage
- ✅ Use conventional commit messages
- ✅ Review performance impact

### Performance
- ✅ Monitor Core Web Vitals
- ✅ Optimize bundle size
- ✅ Use performance budgets
- ✅ Regular Lighthouse audits

### Security
- ✅ Keep dependencies updated
- ✅ Regular security scans
- ✅ Follow security guidelines
- ✅ Document security decisions

## 🎯 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build Success Rate | >95% | Check Dashboard |
| Test Coverage | >70% | Check Dashboard |
| Performance Score | >80 | Check Dashboard |
| Security Vulnerabilities | 0 critical | Check Dashboard |
| Mean Time to Recovery | <2 hours | Check Dashboard |

## 📚 Resources

- 📖 [Detailed CI/CD Documentation](./docs/ci-cd-setup.md)
- 🧪 [Testing Guidelines](./tests/README.md)
- 🔧 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- ⚡ [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)
- 🎭 [Playwright Testing](https://playwright.dev/docs/intro)

---

**🎉 Happy coding with confidence!** The CI/CD infrastructure has your back.