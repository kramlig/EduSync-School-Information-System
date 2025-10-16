#!/usr/bin/env node
// Generate bulk sample data for pressure testing
// Produces: users.json (5k), students.json (5k), grades.json (5k*2 entries), lessons.json (sample), schools.json (1)

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'bulk');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const NUM_USERS = 5000;

function randInt(max) { return Math.floor(Math.random() * max); }

const schools = [{ id: 'mock-school-1', name: 'Mock School', address: '123 Mock St', mock: true }];

const users = [];
const students = [];
const grades = [];
const lessons = [];

for (let i = 1; i <= NUM_USERS; i++) {
  const uid = `mock-user-${i}`;
  users.push({
    id: uid,
    name: `User ${i}`,
    email: `user${i}@example.edu`,
    role: i % 10 === 0 ? 'teacher' : 'student',
    createdAt: new Date().toISOString(),
    mock: true
  });

  // students
  if (i % 10 !== 0) {
    const sid = `mock-student-${i}`;
    students.push({
      id: sid,
      name: `Student ${i}`,
      email: `student${i}@example.edu`,
      enrollmentDate: '2023-09-01',
      dateOfBirth: `2010-01-${String((i%28)+1).padStart(2,'0')}`,
      sex: (i % 2 === 0) ? 'Male' : 'Female',
      lrn: String(100000000000 + i),
      sectionId: `sec${(i%20)+1}`,
      mock: true
    });

    // grades - two per student
    grades.push({ id: `mock-grade-${i}-1`, studentId: sid, subject: 'Math', score: 60 + randInt(41), term: '2025-Q1', mock: true });
    grades.push({ id: `mock-grade-${i}-2`, studentId: sid, subject: 'Science', score: 60 + randInt(41), term: '2025-Q1', mock: true });
  }
}

lessons.push({ id: 'mock-lesson-1', title: 'Intro to Mocking', createdAt: new Date().toISOString(), mock: true });

fs.writeFileSync(path.join(OUT, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(OUT, 'students.json'), JSON.stringify(students, null, 2));
fs.writeFileSync(path.join(OUT, 'grades.json'), JSON.stringify(grades, null, 2));
fs.writeFileSync(path.join(OUT, 'lessons.json'), JSON.stringify(lessons, null, 2));
fs.writeFileSync(path.join(OUT, 'schools.json'), JSON.stringify(schools, null, 2));

console.log('Generated bulk sample data in', OUT);
console.log(`users: ${users.length}, students: ${students.length}, grades: ${grades.length}, lessons: ${lessons.length}, schools: ${schools.length}`);
