/**
 * Parse Test Output to JUnit XML
 * 
 * Converts test output from firestore-rules.test.cjs to JUnit XML format
 * for GitHub Actions test reporting
 */

const fs = require('fs');
const path = require('path');

function parseTestOutput(logContent) {
  const tests = [];
  let currentTest = null;
  
  const lines = logContent.split('\n');
  
  for (const line of lines) {
    // Match test results
    if (line.match(/^✓/) || line.match(/^✗/)) {
      const status = line.startsWith('✓') ? 'PASSED' : 'FAILED';
      const name = line.substring(2).trim();
      
      currentTest = {
        name,
        status,
        error: null
      };
      
      tests.push(currentTest);
    }
    // Match error messages
    else if (line.match(/^\s+Error:/) && currentTest && currentTest.status === 'FAILED') {
      currentTest.error = line.trim();
    }
  }
  
  return tests;
}

function generateJUnitXML(tests) {
  const passed = tests.filter(t => t.status === 'PASSED').length;
  const failed = tests.filter(t => t.status === 'FAILED').length;
  const total = tests.length;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<testsuites name="Firestore Security Rules Tests" tests="${total}" failures="${failed}" time="0">\n`;
  xml += `  <testsuite name="Security Rules" tests="${total}" failures="${failed}" time="0">\n`;
  
  for (const test of tests) {
    xml += `    <testcase name="${escapeXml(test.name)}" classname="FirestoreRules" time="0">\n`;
    
    if (test.status === 'FAILED') {
      xml += `      <failure message="${escapeXml(test.error || 'Test failed')}">\n`;
      xml += `        ${escapeXml(test.error || 'No error message')}\n`;
      xml += `      </failure>\n`;
    }
    
    xml += `    </testcase>\n`;
  }
  
  xml += '  </testsuite>\n';
  xml += '</testsuites>\n';
  
  return xml;
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node parse-test-output-to-junit.cjs <input-log> <output-xml>');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1];
  
  try {
    console.log(`Reading test output from: ${inputFile}`);
    const logContent = fs.readFileSync(inputFile, 'utf8');
    
    console.log('Parsing test results...');
    const tests = parseTestOutput(logContent);
    
    console.log(`Found ${tests.length} tests`);
    console.log(`Passed: ${tests.filter(t => t.status === 'PASSED').length}`);
    console.log(`Failed: ${tests.filter(t => t.status === 'FAILED').length}`);
    
    console.log('Generating JUnit XML...');
    const junitXml = generateJUnitXML(tests);
    
    console.log(`Writing JUnit XML to: ${outputFile}`);
    fs.writeFileSync(outputFile, junitXml, 'utf8');
    
    console.log('✓ JUnit XML generated successfully');
    
    // Exit with error code if tests failed
    const failed = tests.filter(t => t.status === 'FAILED').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error parsing test output:', error.message);
    process.exit(1);
  }
}

main();
