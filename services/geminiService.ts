import { GoogleGenAI } from "@google/genai";
import type { Student, LearningArea, Grade, SubGradeRecord } from '../types';

if (!process.env.API_KEY) {
  // A check to ensure the API key is available. 
  // In a real app, this would be handled more gracefully.
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined;
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade);
  if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

export const generateStudentReport = async (
  student: Student,
  grades: Grade[],
  learningAreas: LearningArea[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return Promise.resolve("AI features are disabled. API key is missing.");
  }

  const studentGrades = grades
    .filter((g) => g.studentId === student.id)
    .map((g) => {
      const learningArea = learningAreas.find((c) => c.id === g.learningAreaId);
      if (!learningArea) return null;

      const q1Avg = calculateQuarterAverage(g.q1);
      const q2Avg = calculateQuarterAverage(g.q2);
      const q3Avg = calculateQuarterAverage(g.q3);
      const q4Avg = calculateQuarterAverage(g.q4);

      const quarterDetails = [
        q1Avg !== undefined ? `Q1: ${q1Avg}%` : null,
        q2Avg !== undefined ? `Q2: ${q2Avg}%` : null,
        q3Avg !== undefined ? `Q3: ${q3Avg}%` : null,
        q4Avg !== undefined ? `Q4: ${q4Avg}%` : null,
      ].filter(Boolean).join(', ');

      return {
        learningAreaName: learningArea.name,
        details: `Quarterly Grades: [${quarterDetails}]. Final Grade: ${g.finalGrade ?? 'N/A'}%. Remarks: ${g.remarks ?? 'N/A'}.`
      };
    }).filter(Boolean);

  if (studentGrades.length === 0) {
    return "This student has no grades recorded yet. A report cannot be generated.";
  }

  const gradesText = studentGrades
    .map((sg) => `${sg!.learningAreaName}: ${sg!.details}`)
    .join('\n');

  const prompt = `
    You are a compassionate and experienced academic advisor for a school. 
    Your task is to generate a brief, constructive performance report for a student based on their recent quarterly grades.
    The tone should be encouraging, professional, and supportive.
    
    Instructions:
    1. Start with a positive opening statement acknowledging the student's efforts over the school year.
    2. Analyze the provided quarterly grades. Look for trends (e.g., consistent high performance, improvement over quarters, or areas of decline).
    3. Highlight 1-2 learning areas where the student is excelling (Final Grade above 85%). Mention any consistent performance or strong improvement.
    4. Identify 1-2 learning areas where there might be room for improvement (Final Grade below 75%).
    5. Provide one specific, actionable suggestion for improvement. This could be related to consistency, or focusing on a subject that showed a decline.
    6. End with a positive and motivational closing statement about finishing the year strong.
    7. Keep the entire report concise, around 5-7 sentences. Format the output as a single block of text.

    Student Details:
    - Name: ${student.name}
    - Grades Summary:
    ${gradesText}

    Generate the report now.
  `;

  try {
    // FIX: Use `contents` property for the prompt and access `.text` directly on the response, as per API guidelines.
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
