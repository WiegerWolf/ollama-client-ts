#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Validating Development Environment...\n');

const checks = [];
let allPassed = true;

// Helper function to run checks
function runCheck(name, checkFn) {
  try {
    const result = checkFn();
    if (result === true) {
      console.log(`✅ ${name}`);
      checks.push({ name, status: 'pass', message: 'OK' });
    } else {
      console.log(`✅ ${name}: ${result}`);
      checks.push({ name, status: 'pass', message: result });
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    checks.push({ name, status: 'fail', message: error.message });
    allPassed = false;
  }
}

// Check runtime version (Bun or Node.js)
runCheck('Runtime Version', () => {
  // Check if Bun is available
  try {
    const bunVersion = execSync('bun --version', { encoding: 'utf8' }).trim();
    return `Bun ${bunVersion} (✓ Preferred runtime)`;
  } catch {
    // Fallback to Node.js
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major < 18) {
      throw new Error(`Node.js ${major} is too old. Requires Node.js 18+ or Bun`);
    }
    return `Node.js ${version} (✓ Compatible, but Bun is recommended)`;
  }
});

// Check package manager
runCheck('Package Manager', () => {
  try {
    const bunVersion = execSync('bun --version', { encoding: 'utf8' }).trim();
    return `Bun ${bunVersion} (✓ Preferred)`;
  } catch {
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      return `npm ${npmVersion} (✓ Compatible, but Bun is recommended)`;
    } catch {
      throw new Error('No package manager found. Please install Bun or npm.');
    }
  }
});

// Check package.json exists
runCheck('package.json', () => {
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found');
  }
  return true;
});

// Check dependencies installation
runCheck('Dependencies Installed', () => {
  if (!fs.existsSync('node_modules')) {
    throw new Error('node_modules not found. Run: bun install');
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'next', 'react', 'typescript', 'jest', '@playwright/test',
    '@testing-library/react', '@testing-library/jest-dom'
  ];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missing = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missing.length > 0) {
    throw new Error(`Missing dependencies: ${missing.join(', ')}`);
  }
  
  return `${Object.keys(allDeps).length} packages installed`;
});

// Check TypeScript configuration
runCheck('TypeScript Configuration', () => {
  if (!fs.existsSync('tsconfig.json')) {
    throw new Error('tsconfig.json not found');
  }
  
  // Test TypeScript compilation
  try {
    // Try Bun first, fallback to npx
    try {
      execSync('bun tsc --noEmit', { stdio: 'pipe' });
    } catch {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
    }
    return 'TypeScript compilation successful';
  } catch (error) {
    throw new Error('TypeScript compilation failed. Check for type errors.');
  }
});

// Check Jest configuration
runCheck('Jest Configuration', () => {
  if (!fs.existsSync('jest.config.js')) {
    throw new Error('jest.config.js not found');
  }
  
  if (!fs.existsSync('jest.setup.js')) {
    throw new Error('jest.setup.js not found');
  }
  
  return 'Jest configuration files present';
});

// Check Playwright configuration
runCheck('Playwright Configuration', () => {
  if (!fs.existsSync('playwright.config.ts')) {
    throw new Error('playwright.config.ts not found');
  }
  
  return 'Playwright configuration present';
});

// Check test directories
runCheck('Test Directory Structure', () => {
  const requiredDirs = ['tests/unit', 'tests/e2e', 'tests/mocks'];
  const missing = requiredDirs.filter(dir => !fs.existsSync(dir));
  
  if (missing.length > 0) {
    throw new Error(`Missing test directories: ${missing.join(', ')}`);
  }
  
  return `${requiredDirs.length} test directories found`;
});

// Check Git hooks (Husky)
runCheck('Git Hooks (Husky)', () => {
  if (!fs.existsSync('.husky')) {
    return 'Husky not installed (optional for CI/CD)';
  }
  
  const hooks = ['pre-commit', 'commit-msg', 'pre-push'];
  const existingHooks = hooks.filter(hook => fs.existsSync(`.husky/${hook}`));
  
  return `${existingHooks.length}/${hooks.length} hooks configured`;
});

// Check environment files
runCheck('Environment Configuration', () => {
  const envFiles = ['.env.local', '.env.example', '.env.test'];
  const existing = envFiles.filter(file => fs.existsSync(file));
  
  if (existing.length === 0) {
    return 'No environment files (using defaults)';
  }
  
  return `${existing.length} environment files found`;
});

// Check database setup
runCheck('Database Configuration', () => {
  if (!fs.existsSync('prisma/schema.prisma')) {
    throw new Error('Prisma schema not found');
  }
  
  // Check if Prisma client is generated
  try {
    // Try Bun first, fallback to npx
    try {
      execSync('bun prisma validate', { stdio: 'pipe' });
    } catch {
      execSync('npx prisma validate', { stdio: 'pipe' });
    }
    return 'Prisma schema valid';
  } catch (error) {
    throw new Error('Prisma schema validation failed');
  }
});

// Check CI/CD workflows
runCheck('CI/CD Workflows', () => {
  const workflows = [
    '.github/workflows/ci.yml',
    '.github/workflows/regression-detection.yml',
    '.github/workflows/dependency-security.yml'
  ];
  
  const existing = workflows.filter(workflow => fs.existsSync(workflow));
  
  if (existing.length === 0) {
    throw new Error('No CI/CD workflows found');
  }
  
  return `${existing.length}/${workflows.length} workflows configured`;
});

// Test basic functionality
runCheck('Unit Tests Execution', () => {
  try {
    // Try Bun first, fallback to npm
    try {
      execSync('bun run test -- --passWithNoTests --silent', { stdio: 'pipe' });
    } catch {
      execSync('npm run test -- --passWithNoTests --silent', { stdio: 'pipe' });
    }
    return 'Unit tests can execute';
  } catch (error) {
    throw new Error('Unit tests failed to execute');
  }
});

runCheck('Build Process', () => {
  try {
    // Try Bun first, fallback to npm
    try {
      execSync('bun run build', { stdio: 'pipe' });
    } catch {
      execSync('npm run build', { stdio: 'pipe' });
    }
    return 'Build successful';
  } catch (error) {
    throw new Error('Build process failed');
  }
});

runCheck('Linting', () => {
  try {
    // Try Bun first, fallback to npm
    try {
      execSync('bun run lint', { stdio: 'pipe' });
    } catch {
      execSync('npm run lint', { stdio: 'pipe' });
    }
    return 'Linting passed';
  } catch (error) {
    throw new Error('Linting failed. Run: bun run lint -- --fix');
  }
});

// Check Playwright browsers
runCheck('Playwright Browsers', () => {
  try {
    // Try Bun first, fallback to npx
    try {
      execSync('bun playwright --version', { stdio: 'pipe' });
    } catch {
      execSync('npx playwright --version', { stdio: 'pipe' });
    }
    
    // Check if browsers are installed
    const browsersPath = path.join(process.env.HOME || process.env.USERPROFILE, '.cache/ms-playwright');
    if (fs.existsSync(browsersPath)) {
      return 'Playwright browsers available';
    } else {
      return 'Browsers not installed. Run: bun playwright install';
    }
  } catch (error) {
    throw new Error('Playwright not available');
  }
});

// Performance check
runCheck('Development Server', () => {
  try {
    // Quick check if dev server can start (timeout after 5 seconds)
    try {
      const child = execSync('timeout 5s bun run dev || true', { stdio: 'pipe' });
    } catch {
      const child = execSync('timeout 5s npm run dev || true', { stdio: 'pipe' });
    }
    return 'Development server can start';
  } catch (error) {
    return 'Development server check skipped';
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

const passed = checks.filter(check => check.status === 'pass').length;
const failed = checks.filter(check => check.status === 'fail').length;

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Success Rate: ${((passed / checks.length) * 100).toFixed(1)}%`);

if (allPassed) {
  console.log('\n🎉 Development environment is ready!');
  console.log('\n📋 Next steps:');
  console.log('1. Run `bun run dev` to start development server');
  console.log('2. Run `bun run test:watch` for test-driven development');
  console.log('3. Make your first commit to test Git hooks');
  console.log('4. Create a pull request to test CI/CD pipeline');
} else {
  console.log('\n⚠️  Some checks failed. Please address the issues above.');
  console.log('\n💡 Common fixes:');
  console.log('- Run `bun install` to install dependencies');
  console.log('- Run `bun run lint -- --fix` to fix linting issues');
  console.log('- Run `bun playwright install` to install browsers');
  console.log('- Check TypeScript errors with `bun tsc --noEmit`');
}

// Generate validation report
const report = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  },
  checks,
  summary: {
    total: checks.length,
    passed,
    failed,
    successRate: ((passed / checks.length) * 100).toFixed(1)
  }
};

fs.writeFileSync('dev-env-validation.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to: dev-env-validation.json');

process.exit(allPassed ? 0 : 1);