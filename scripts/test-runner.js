#!/usr/bin/env node

const { spawn } = require('child_process')
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
  magenta: '\x1b[35m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

async function checkDependencies() {
  logHeader('Checking Dependencies')
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@playwright/test',
    'jest',
    'msw',
  ]

  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
  )

  if (missingDeps.length > 0) {
    logError(`Missing dependencies: ${missingDeps.join(', ')}`)
    logInfo('Run: npm install')
    return false
  }

  logSuccess('All dependencies are installed')
  return true
}

async function checkTestFiles() {
  logHeader('Checking Test Files')
  
  const testDirs = ['tests/unit', 'tests/e2e', 'tests/mocks']
  const requiredFiles = [
    'jest.config.js',
    'jest.setup.js',
    'playwright.config.ts',
    'tests/utils/test-utils.tsx',
    'tests/mocks/data.ts',
    'tests/mocks/handlers.ts',
  ]

  let allFilesExist = true

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      logError(`Missing file: ${file}`)
      allFilesExist = false
    }
  }

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      logError(`Missing directory: ${dir}`)
      allFilesExist = false
    }
  }

  if (allFilesExist) {
    logSuccess('All test files and directories exist')
  }

  return allFilesExist
}

async function runUnitTests() {
  logHeader('Running Unit Tests')
  
  try {
    await runCommand('bun', ['run', 'test', '--', '--coverage', '--watchAll=false'])
    logSuccess('Unit tests passed')
    return true
  } catch (error) {
    logError('Unit tests failed')
    return false
  }
}

async function runE2ETests() {
  logHeader('Running E2E Tests')
  
  try {
    // Check if Playwright browsers are installed
    try {
      await runCommand('bun', ['playwright', 'install', '--dry-run'], { stdio: 'pipe' })
    } catch {
      logInfo('Installing Playwright browsers...')
      await runCommand('bun', ['playwright', 'install'])
    }

    await runCommand('bun', ['run', 'test:e2e'])
    logSuccess('E2E tests passed')
    return true
  } catch (error) {
    logError('E2E tests failed')
    return false
  }
}

async function generateCoverageReport() {
  logHeader('Generating Coverage Report')
  
  try {
    await runCommand('bun', ['run', 'test:coverage', '--', '--watchAll=false'])
    
    if (fs.existsSync('coverage/lcov-report/index.html')) {
      logSuccess('Coverage report generated: coverage/lcov-report/index.html')
    }
    
    return true
  } catch (error) {
    logError('Failed to generate coverage report')
    return false
  }
}

async function lintTests() {
  logHeader('Linting Test Files')
  
  try {
    await runCommand('bun', ['eslint', 'tests/**/*.{ts,tsx,js}', '--fix'])
    logSuccess('Test files linted successfully')
    return true
  } catch (error) {
    logWarning('Linting issues found (non-blocking)')
    return true // Don't fail the entire test run for linting issues
  }
}

async function checkTestCoverage() {
  logHeader('Checking Test Coverage')
  
  if (!fs.existsSync('coverage/coverage-summary.json')) {
    logWarning('Coverage summary not found, skipping coverage check')
    return true
  }

  try {
    const coverageSummary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'))
    const { total } = coverageSummary
    
    const thresholds = {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    }

    let coveragePassed = true

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const coverage = total[metric].pct
      if (coverage < threshold) {
        logError(`${metric} coverage (${coverage}%) below threshold (${threshold}%)`)
        coveragePassed = false
      } else {
        logSuccess(`${metric} coverage: ${coverage}%`)
      }
    }

    return coveragePassed
  } catch (error) {
    logError('Failed to check coverage thresholds')
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const options = {
    skipE2E: args.includes('--skip-e2e'),
    skipUnit: args.includes('--skip-unit'),
    skipLint: args.includes('--skip-lint'),
    skipCoverage: args.includes('--skip-coverage'),
    help: args.includes('--help') || args.includes('-h'),
  }

  if (options.help) {
    log('Test Runner for Ollama Client TypeScript', 'bright')
    log('\nUsage: node scripts/test-runner.js [options]')
    log('\nOptions:')
    log('  --skip-e2e      Skip end-to-end tests')
    log('  --skip-unit     Skip unit tests')
    log('  --skip-lint     Skip linting')
    log('  --skip-coverage Skip coverage check')
    log('  --help, -h      Show this help message')
    return
  }

  log('🧪 Ollama Client TypeScript Test Runner', 'bright')
  log('Starting comprehensive test suite...', 'cyan')

  const startTime = Date.now()
  let success = true

  try {
    // Pre-flight checks
    if (!(await checkDependencies())) {
      process.exit(1)
    }

    if (!(await checkTestFiles())) {
      process.exit(1)
    }

    // Linting (optional)
    if (!options.skipLint) {
      await lintTests()
    }

    // Unit tests
    if (!options.skipUnit) {
      if (!(await runUnitTests())) {
        success = false
      }
    }

    // Coverage check
    if (!options.skipCoverage && !options.skipUnit) {
      if (!(await checkTestCoverage())) {
        success = false
      }
    }

    // E2E tests
    if (!options.skipE2E) {
      if (!(await runE2ETests())) {
        success = false
      }
    }

    // Generate final coverage report
    if (!options.skipCoverage && !options.skipUnit) {
      await generateCoverageReport()
    }

  } catch (error) {
    logError(`Test runner failed: ${error.message}`)
    success = false
  }

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  logHeader('Test Results Summary')
  
  if (success) {
    logSuccess(`All tests completed successfully in ${duration}s`)
    log('\n🎉 Test suite passed! Your code is ready for deployment.', 'green')
  } else {
    logError(`Test suite failed after ${duration}s`)
    log('\n💥 Some tests failed. Please review the output above.', 'red')
  }

  process.exit(success ? 0 : 1)
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`)
  process.exit(1)
})

if (require.main === module) {
  main()
}

module.exports = { runCommand, checkDependencies, checkTestFiles }