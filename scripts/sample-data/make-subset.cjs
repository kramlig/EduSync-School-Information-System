#!/usr/bin/env node
// Create a subset of the bulk sample-data for controlled migrations
// Usage: node make-subset.cjs --source bulk --out bulk-subset --count 500

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('source', { type: 'string', default: 'bulk' })
  .option('out', { type: 'string', default: 'bulk-subset' })
  .option('count', { type: 'number', default: 500 })
  .argv;

const srcDir = path.join(__dirname, argv.source);
const outDir = path.join(__dirname, argv.out);
if (!fs.existsSync(srcDir)) { console.error('Source dir not found', srcDir); process.exit(1); }
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function read(name) {
  const p = path.join(srcDir, name + '.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p,'utf8'));
}

function write(name, data) {
  fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(data, null, 2));
}

const users = read('users');
const students = read('students');
const grades = read('grades');
const lessons = read('lessons');
const schools = read('schools');

const N = Math.min(argv.count, users.length);
const subsetUsers = users.slice(0, N);

// Include students and grades for users who are students (id starts with mock-student or mapping by index)
// Our generator named students mock-student-{i} for those not teachers. We'll include student docs that correspond to indices 1..N where applicable.
const subsetStudents = students.filter(s => {
  // if student id contains a number <= N
  const m = s.id && s.id.match(/mock-student-(\d+)/);
  if (!m) return false;
  return parseInt(m[1], 10) <= N;
});

const subsetGrades = grades.filter(g => {
  const m = g.studentId && g.studentId.match(/mock-student-(\d+)/);
  if (!m) return false;
  return parseInt(m[1],10) <= N;
});

// keep lessons and schools as-is (small)
write('users', subsetUsers);
write('students', subsetStudents);
write('grades', subsetGrades);
write('lessons', lessons);
write('schools', schools);

console.log('Wrote subset to', outDir, `users:${subsetUsers.length} students:${subsetStudents.length} grades:${subsetGrades.length}`);
