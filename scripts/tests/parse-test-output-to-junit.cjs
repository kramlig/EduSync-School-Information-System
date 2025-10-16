const fs = require('fs');
const path = require('path');

// Usage: node parse-test-output-to-junit.cjs <input-log> <output-xml>
const [,, input, output] = process.argv;
if (!input || !output) {
  console.error('Usage: node parse-test-output-to-junit.cjs <input-log> <output-xml>');
  process.exit(2);
}

const raw = fs.existsSync(input) ? fs.readFileSync(input, 'utf8') : '';
const lines = raw.split(/\r?\n/);

const tests = [];
let current = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('PASS ')) {
    const name = line.slice(5).trim();
    tests.push({ name, status: 'passed', output: '' });
    current = tests[tests.length - 1];
  } else if (line.startsWith('FAIL ')) {
    const rest = line.slice(5).trim();
    const name = rest.split(':')[0].trim();
    tests.push({ name, status: 'failed', output: rest + '\n' });
    current = tests[tests.length - 1];
  } else {
    if (current) {
      current.output += line + '\n';
    }
  }
}

const total = tests.length;
const failures = tests.filter(t => t.status === 'failed').length;

let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
xml += `<testsuite name="firestore-rules-tests" tests="${total}" failures="${failures}">\n`;
for (const t of tests) {
  xml += `  <testcase classname="firestore.rules" name="${escapeXml(t.name)}">\n`;
  if (t.status === 'failed') {
    xml += `    <failure><![CDATA[${t.output}]]></failure>\n`;
  } else if (t.output && t.output.trim()) {
    xml += `    <system-out><![CDATA[${t.output}]]></system-out>\n`;
  }
  xml += '  </testcase>\n';
}
xml += '</testsuite>\n';

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, xml, 'utf8');
console.log(`Wrote JUnit XML to ${output} (tests=${total}, failures=${failures})`);
process.exit(failures > 0 ? 1 : 0);

function escapeXml(s) {
  return s.replace(/[<>&\"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
    }
  });
}
