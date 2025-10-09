
import { GoogleGenAI } from "@google/genai";
import type { Student, Course, Grade } from '../types';

if (!process.env.API_KEY) {
  // A check to ensure the API key is available. 
  // In a real app, this would be handled more gracefully.
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateStudentReport = async (
  student: Student,
  grades: Grade[],
  courses: Course[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return Promise.resolve("AI features are disabled. API key is missing.");
  }

  const studentGrades = grades
    .filter((g) => g.studentId === student.id)
    .map((g) => {
      const course = courses.find((c) => c.id === g.courseId);
      return {
        courseName: course?.name || 'Unknown Course',
        grade: g.grade,
      };
    });

  if (studentGrades.length === 0) {
    return "This student has no grades recorded yet. A report cannot be generated.";
  }

  const gradesText = studentGrades
    .map((sg) => `${sg.courseName}: ${sg.grade}%`)
    .join(', ');

  const prompt = `
    You are a compassionate and experienced academic advisor for a school. 
    Your task is to generate a brief, constructive performance report for a student based on their recent grades.
    The tone should be encouraging, professional, and supportive.
    
    Instructions:
    1. Start with a positive opening statement acknowledging the student's efforts.
    2. Analyze the provided grades. Highlight 1-2 courses where the student is excelling (grades above 85%).
    3. Identify 1-2 courses where there might be room for improvement (grades below 75%).
    4. Provide one specific, actionable suggestion for improvement. For example, suggest focusing on specific topics, forming a study group, or seeking help from the teacher.
    5. End with a positive and motivational closing statement.
    6. Keep the entire report concise, around 4-6 sentences. Format the output as a single block of text.

    Student Details:
    - Name: ${student.name}
    - Grades: ${gradesText}

    Generate the report now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating student report:", error);
    return "There was an error generating the report. Please check the API configuration and try again.";
  }
};
