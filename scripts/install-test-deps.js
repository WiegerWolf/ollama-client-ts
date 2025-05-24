#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`  ${message}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function runCommand(command, description) {
  try {
    logInfo(`${description}...`)
    execSync(command, { stdio: 'inherit' })
    logSuccess(`${description} completed`)
    return true
  } catch (error) {
    logError(`${description} failed: ${error.message}`)
    return false
  }
}

function checkPackageManager() {
  try {
    execSync('bun --version', { stdio: 'pipe' })
    return 'bun'
  } catch {
    try {
      execSync('npm --version', { stdio: 'pipe' })
      return 'npm'
    } catch {
      try {
        execSync('yarn --version', { stdio: 'pipe' })
        return 'yarn'
      } catch {
        try {
          execSync('pnpm --version', { stdio: 'pipe' })
          return 'pnpm'
        } catch {
          logError('No package manager found. Please install Bun, npm, yarn, or pnpm.')
          process.exit(1)
        }
      }
    }
  }
}

function installDependencies(packageManager) {
  logHeader('Installing Test Dependencies')
  
  const testDependencies = [
    '@testing-library/react@^16.1.0',
    '@testing-library/jest-dom@^6.6.3',
    '@testing-library/user-event@^14.5.2',
    '@playwright/test@^1.49.1',
    'jest@^29.7.0',
    'jest-environment-jsdom@^29.7.0',
    '@types/jest@^29.5.14',
    'msw@^2.6.8',
    'whatwg-fetch@^3.6.20',
    'ts-jest@^29.2.5',
  ]

  const installCommand = packageManager === 'bun'
    ? `bun add --dev ${testDependencies.join(' ')}`
    : packageManager === 'npm'
    ? `npm install --save-dev ${testDependencies.join(' ')}`
    : packageManager === 'yarn'
    ? `yarn add --dev ${testDependencies.join(' ')}`
    : `pnpm add --save-dev ${testDependencies.join(' ')}`

  return runCommand(installCommand, 'Installing test dependencies')
}

function installPlaywrightBrowsers() {
  logHeader('Installing Playwright Browsers')
  return runCommand('bun playwright install', 'Installing Playwright browsers')
}

function createTestDirectories() {
  logHeader('Creating Test Directory Structure')
  
  const directories = [
    'tests',
    'tests/unit',
    'tests/unit/api',
    'tests/unit/components',
    'tests/unit/stores',
    'tests/unit/lib',
    'tests/e2e',
    'tests/mocks',
    'tests/utils',
  ]

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      logSuccess(`Created directory: ${dir}`)
    } else {
      logInfo(`Directory already exists: ${dir}`)
    }
  })

  return true
}

function updatePackageJsonScripts() {
  logHeader('Updating package.json Scripts')
  
  try {
    const packageJsonPath = 'package.json'
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const testScripts = {
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'test:e2e': 'playwright test',
      'test:e2e:ui': 'playwright test --ui',
      'test:all': 'bun run test && bun run test:e2e',
      'test:setup': 'bun scripts/install-test-deps.js',
      'test:run': 'bun scripts/test-runner.js',
    }

    packageJson.scripts = { ...packageJson.scripts, ...testScripts }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    logSuccess('Updated package.json scripts')
    return true
  } catch (error) {
    logError(`Failed to update package.json: ${error.message}`)
    return false
  }
}

function createGitIgnoreEntries() {
  logHeader('Updating .gitignore')
  
  const gitignoreEntries = [
    '# Test coverage',
    'coverage/',
    '# Playwright',
    'test-results/',
    'playwright-report/',
    'playwright/.cache/',
    '# Jest',
    '.jest-cache/',
    '# Test databases',
    'test.db',
    'test.db-journal',
  ]

  const gitignorePath = '.gitignore'
  let gitignoreContent = ''
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
  }

  const newEntries = gitignoreEntries.filter(entry => 
    !gitignoreContent.includes(entry.replace('# ', ''))
  )

  if (newEntries.length > 0) {
    const updatedContent = gitignoreContent + '\n\n' + newEntries.join('\n') + '\n'
    fs.writeFileSync(gitignorePath, updatedContent)
    logSuccess('Updated .gitignore with test-related entries')
  } else {
    logInfo('.gitignore already contains test entries')
  }

  return true
}

function createVSCodeSettings() {
  logHeader('Creating VS Code Settings')
  
  const vscodeDir = '.vscode'
  const settingsPath = path.join(vscodeDir, 'settings.json')
  
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir)
  }

  const settings = {
    'jest.jestCommandLine': 'bun run test --',
    'jest.autoRun': 'off',
    'jest.showCoverageOnLoad': true,
    'typescript.preferences.includePackageJsonAutoImports': 'auto',
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': true
    },
    'files.associations': {
      '*.test.ts': 'typescript',
      '*.test.tsx': 'typescriptreact',
      '*.spec.ts': 'typescript'
    }
  }

  let existingSettings = {}
  if (fs.existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch {
      // Invalid JSON, start fresh
    }
  }

  const mergedSettings = { ...existingSettings, ...settings }
  fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2))
  logSuccess('Created/updated VS Code settings')

  return true
}

function createTestDatabaseConfig() {
  logHeader('Creating Test Database Configuration')
  
  const envTestPath = '.env.test'
  const testEnvContent = `# Test Environment Variables
DATABASE_URL="file:./test.db"
NEXTAUTH_SECRET="test-secret-key-for-testing-only"
NEXTAUTH_URL="http://localhost:3000"
OLLAMA_BASE_URL="http://localhost:11434"
NODE_ENV="test"
`

  if (!fs.existsSync(envTestPath)) {
    fs.writeFileSync(envTestPath, testEnvContent)
    logSuccess('Created .env.test file')
  } else {
    logInfo('.env.test already exists')
  }

  return true
}

function runInitialTests() {
  logHeader('Running Initial Test Validation')
  
  try {
    // Run a simple test to validate setup
    execSync('bun run test -- --passWithNoTests', { stdio: 'inherit' })
    logSuccess('Test setup validation passed')
    return true
  } catch (error) {
    logError('Test setup validation failed')
    return false
  }
}

function displayNextSteps() {
  logHeader('Setup Complete! Next Steps')
  
  log('Your test environment is now ready. Here\'s what you can do:', 'green')
  log('')
  log('📋 Available Commands:', 'cyan')
  log('  bun run test              - Run unit tests')
  log('  bun run test:watch        - Run tests in watch mode')
  log('  bun run test:coverage     - Run tests with coverage')
  log('  bun run test:e2e          - Run end-to-end tests')
  log('  bun run test:e2e:ui       - Run E2E tests with UI')
  log('  bun run test:all          - Run all tests')
  log('  bun run test:run          - Run comprehensive test suite')
  log('')
  log('📁 Test Structure:', 'cyan')
  log('  tests/unit/               - Unit and integration tests')
  log('  tests/e2e/                - End-to-end tests')
  log('  tests/mocks/              - Mock data and handlers')
  log('  tests/utils/              - Test utilities')
  log('')
  log('🚀 Quick Start:', 'cyan')
  log('  1. Run: bun run test:run')
  log('  2. Open coverage report: coverage/lcov-report/index.html')
  log('  3. View E2E test report: bun playwright show-report')
  log('')
  log('📖 Documentation:', 'cyan')
  log('  Read tests/README.md for detailed information')
  log('')
  log('Happy testing! 🧪', 'green')
}

async function main() {
  log('🔧 Ollama Client TypeScript - Test Environment Setup', 'bright')
  log('Setting up comprehensive testing infrastructure...', 'cyan')

  const packageManager = checkPackageManager()
  logInfo(`Using package manager: ${packageManager}`)

  let success = true

  // Create directory structure
  if (!createTestDirectories()) success = false

  // Install dependencies
  if (!installDependencies(packageManager)) success = false

  // Install Playwright browsers
  if (!installPlaywrightBrowsers()) success = false

  // Update package.json
  if (!updatePackageJsonScripts()) success = false

  // Update .gitignore
  if (!createGitIgnoreEntries()) success = false

  // Create VS Code settings
  if (!createVSCodeSettings()) success = false

  // Create test database config
  if (!createTestDatabaseConfig()) success = false

  // Validate setup
  if (!runInitialTests()) success = false

  if (success) {
    displayNextSteps()
    log('\n🎉 Test environment setup completed successfully!', 'green')
  } else {
    log('\n💥 Setup encountered some issues. Please review the output above.', 'red')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    logError(`Setup failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { 
  checkPackageManager, 
  installDependencies, 
  createTestDirectories,
  updatePackageJsonScripts 
}