#!/usr/bin/env node
/**
 * Static Code Analysis Script
 * 
 * This script performs automated static analysis on the codebase
 * to identify potential issues before manual testing.
 * 
 * Run with: node scripts/static-analysis.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

console.log('🔍 Starting Static Code Analysis...\n');

// Track issues found
const issues = {
  critical: [],
  major: [],
  minor: [],
  warnings: []
};

// Helper to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Helper to find files recursively
function findFiles(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '_generated') {
        findFiles(filePath, pattern, fileList);
      }
    } else if (pattern.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check 1: Verify btoa() usage is documented
console.log('✓ Check 1: Password hashing (btoa) usage...');
const userFiles = findFiles('convex', /users\.ts$/);
userFiles.forEach(file => {
  const content = readFile(file);
  if (content && content.includes('btoa(')) {
    // Check if there's a security comment nearby (within 10 lines)
    const lines = content.split('\n');
    const btoaLineIndex = lines.findIndex(l => l.includes('btoa('));
    const contextLines = lines.slice(Math.max(0, btoaLineIndex - 10), btoaLineIndex + 2).join('\n');
    
    if (!contextLines.includes('SECURITY WARNING') && 
        !contextLines.includes('NOT SECURE') && 
        !contextLines.includes('NOT production-ready') &&
        !contextLines.includes('not secure')) {
      issues.critical.push({
        file,
        message: 'btoa() password hashing found without security warning comment',
        line: btoaLineIndex + 1
      });
    } else {
      issues.warnings.push({
        file,
        message: 'btoa() usage found (documented as not production-ready)',
        severity: 'known limitation'
      });
    }
  }
});

// Check 2: Provider order in layout.tsx
console.log('✓ Check 2: Provider hierarchy in layout.tsx...');
const layoutFile = readFile('app/layout.tsx');
if (layoutFile) {
  const providerOrder = [
    'ErrorBoundary',
    'ConvexClientProvider',
    'DeviceProvider', 
    'DataProvider',
    'LanguageProvider'
  ];
  
  let lastIndex = -1;
  let orderCorrect = true;
  const foundProviders = [];
  
  providerOrder.forEach(provider => {
    const index = layoutFile.indexOf('<' + provider);
    if (index !== -1) {
      if (index < lastIndex) {
        orderCorrect = false;
      }
      foundProviders.push({ provider, index });
      lastIndex = index;
    }
  });
  
  if (!orderCorrect) {
    issues.critical.push({
      file: 'app/layout.tsx',
      message: 'Provider order is incorrect! This will cause runtime errors.',
      providers: providerOrder,
      found: foundProviders
    });
  } else if (foundProviders.length === providerOrder.length) {
    issues.warnings.push({
      file: 'app/layout.tsx',
      message: 'Provider hierarchy verified - order is correct ✓',
      severity: 'good'
    });
  }
}

// Check 3: Check for alert() or confirm() usage (anti-pattern)
console.log('✓ Check 3: Checking for alert()/confirm() anti-patterns...');
const componentFiles = [
  ...findFiles('components', /\.(tsx|ts)$/),
  ...findFiles('app', /\.(tsx|ts)$/)
];

componentFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('alert(') && !line.trim().startsWith('//')) {
        issues.major.push({
          file,
          line: index + 1,
          message: 'Using alert() instead of toast notification',
          code: line.trim()
        });
      }
      if (line.includes('confirm(') && !line.trim().startsWith('//')) {
        issues.major.push({
          file,
          line: index + 1,
          message: 'Using confirm() instead of toast notification',
          code: line.trim()
        });
      }
    });
  }
});

// Check 4: Verify index usage in queries
console.log('✓ Check 4: Checking for queries without indexes...');
const convexFiles = findFiles('convex', /\.ts$/);
convexFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Look for ctx.db.query without withIndex on the next line
      if (line.includes('ctx.db.query(') && !line.includes('withIndex')) {
        // Check next few lines for withIndex
        const nextLines = lines.slice(index + 1, index + 4).join('\n');
        if (!nextLines.includes('withIndex') && !nextLines.includes('.collect()')) {
          issues.minor.push({
            file,
            line: index + 1,
            message: 'Query may not be using index (check if intentional)',
            code: line.trim()
          });
        }
      }
    });
  }
});

// Check 5: Bilingual validation pattern
console.log('✓ Check 5: Checking bilingual validation pattern...');
componentFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Look for old pattern: if (!fieldEn.trim() || !fieldTh.trim())
      if (line.includes('.trim() ||') && line.includes('.trim()')) {
        const match = line.match(/!(\w+)\.trim\(\) \|\| !(\w+)\.trim\(\)/);
        if (match) {
          issues.major.push({
            file,
            line: index + 1,
            message: 'Using old validation pattern (|| instead of &&) - requires BOTH languages',
            suggestion: 'Change to: if (!field1.trim() && !field2.trim()) for at least one language',
            code: line.trim()
          });
        }
      }
    });
  }
});

// Check 6: Verify BilingualInput component usage
console.log('✓ Check 6: Checking BilingualInput component usage...');
const bilingualInputFile = readFile('components/bilingual-input.tsx');
if (bilingualInputFile) {
  issues.warnings.push({
    file: 'components/bilingual-input.tsx',
    message: 'BilingualInput component exists - verify forms use it for consistency'
  });
} else {
  issues.minor.push({
    file: 'components/',
    message: 'BilingualInput component not found - may need to check component structure'
  });
}

// Check 7: Toast notification usage
console.log('✓ Check 7: Verifying toast notification system...');
const toastFile = readFile('lib/toast.ts');
if (!toastFile) {
  issues.critical.push({
    file: 'lib/toast.ts',
    message: 'Toast notification system not found - UI feedback may be broken'
  });
}

// Check 8: Check for hardcoded strings (missing bilingual support)
console.log('✓ Check 8: Checking for potential missing translations...');
componentFiles.forEach(file => {
  const content = readFile(file);
  if (content && !file.includes('test')) {
    // Look for button text or labels without translation helper
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('<button') || line.includes('<label')) {
        // Check if using t() helper or has both EN and TH
        if (!line.includes(' t(') && !line.includes('titleTh') && !line.includes('labelTh')) {
          // Skip if it's just closing tags or props
          if (line.includes('>') && !line.includes('</button>') && !line.includes('</label>')) {
            issues.minor.push({
              file,
              line: index + 1,
              message: 'Potential missing bilingual support in UI element',
              code: line.trim().substring(0, 60) + '...'
            });
          }
        }
      }
    });
  }
});

// Check 9: Verify Sangsom school setup
console.log('✓ Check 9: Checking Sangsom school setup...');
const sangsomSeedFile = readFile('convex/seedSangsomProject.ts');
if (sangsomSeedFile) {
  if (!sangsomSeedFile.includes('"Sangsom School"')) {
    issues.major.push({
      file: 'convex/seedSangsomProject.ts',
      message: 'Sangsom School name not found in seed script'
    });
  }
} else {
  issues.major.push({
    file: 'convex/seedSangsomProject.ts',
    message: 'Sangsom seed script not found - cannot create Piglet student'
  });
}

// Check 10: Verify test mutation exists
console.log('✓ Check 10: Verifying Piglet student test mutation...');
const pigletTestFile = readFile('convex/testPigletStudent.ts');
if (pigletTestFile) {
  if (!pigletTestFile.includes('createPigletStudent')) {
    issues.major.push({
      file: 'convex/testPigletStudent.ts',
      message: 'createPigletStudent mutation not found'
    });
  }
  if (!pigletTestFile.includes('grade: "1"')) {
    issues.major.push({
      file: 'convex/testPigletStudent.ts',
      message: 'Piglet grade not set to "1"'
    });
  }
  if (!pigletTestFile.includes('class: "/6"')) {
    issues.major.push({
      file: 'convex/testPigletStudent.ts',
      message: 'Piglet class not set to "/6"'
    });
  }
} else {
  issues.critical.push({
    file: 'convex/testPigletStudent.ts',
    message: 'Piglet student test mutation not found - cannot fulfill requirement'
  });
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 STATIC ANALYSIS RESULTS');
console.log('='.repeat(60) + '\n');

if (issues.critical.length > 0) {
  console.log('🔴 CRITICAL ISSUES (' + issues.critical.length + '):');
  issues.critical.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.file}${issue.line ? ':' + issue.line : ''}`);
    console.log(`     ${issue.message}`);
    if (issue.code) console.log(`     Code: ${issue.code}`);
  });
  console.log('\n');
}

if (issues.major.length > 0) {
  console.log('🟡 MAJOR ISSUES (' + issues.major.length + '):');
  issues.major.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.file}${issue.line ? ':' + issue.line : ''}`);
    console.log(`     ${issue.message}`);
    if (issue.suggestion) console.log(`     Suggestion: ${issue.suggestion}`);
    if (issue.code) console.log(`     Code: ${issue.code}`);
  });
  console.log('\n');
}

if (issues.minor.length > 0) {
  console.log('🔵 MINOR ISSUES (' + issues.minor.length + '):');
  issues.minor.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.file}${issue.line ? ':' + issue.line : ''}`);
    console.log(`     ${issue.message}`);
    if (issue.code && issue.code.length < 80) console.log(`     Code: ${issue.code}`);
  });
  console.log('\n');
}

if (issues.warnings.length > 0) {
  console.log('⚠️  WARNINGS (' + issues.warnings.length + '):');
  issues.warnings.forEach((issue, i) => {
    console.log(`\n  ${i + 1}. ${issue.file}`);
    console.log(`     ${issue.message}`);
    if (issue.severity) console.log(`     Severity: ${issue.severity}`);
  });
  console.log('\n');
}

// Summary
const totalIssues = issues.critical.length + issues.major.length + issues.minor.length;
console.log('='.repeat(60));
console.log('📈 SUMMARY');
console.log('='.repeat(60));
console.log(`Critical: ${issues.critical.length}`);
console.log(`Major: ${issues.major.length}`);
console.log(`Minor: ${issues.minor.length}`);
console.log(`Warnings: ${issues.warnings.length}`);
console.log(`Total Issues: ${totalIssues}`);
console.log('='.repeat(60) + '\n');

if (issues.critical.length > 0) {
  console.log('❌ FAIL: Critical issues found - must fix before deployment\n');
  process.exit(1);
} else if (issues.major.length > 0) {
  console.log('⚠️  WARN: Major issues found - should fix before testing\n');
  process.exit(0);
} else {
  console.log('✅ PASS: No critical or major issues found\n');
  process.exit(0);
}
