import type { Student, LearningArea, Grade, SubGradeRecord } from '../types';

async function postJson(path: string, body: any) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

const calculateQuarterAverage = (grade: number | SubGradeRecord | undefined): number | undefined => {
  if (grade === undefined) return undefined;
  if (typeof grade === 'number') return grade;
  const subGrades = Object.values(grade).filter(g => typeof g === 'number');
  if (subGrades.length === 0) return undefined;
  const total = subGrades.reduce((acc, val) => acc + val, 0);
  return Math.round(total / subGrades.length);
};

export const generateStudentReport = async (
  student: Student,
  grades: Grade[],
  learningAreas: LearningArea[]
): Promise<string> => {
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
    const result = await postJson('/api/generateStudentReport', { prompt, studentId: student.id });
    return result.text ?? result;
  } catch (error: any) {
    console.error('Error generating student report (client):', error);
    return 'There was an error generating the report. Please check the API configuration and try again.';
  }
};


export type GeneratedLessonPlan = {
    title: string;
    objectives: string[];
    activities: string[];
    materials: string[];
    assessment: string[];
};

export const generateLessonPlan = async (
    topic: string,
    gradeLevel: number,
    objectives: string
): Promise<GeneratedLessonPlan> => {
    const prompt = `
      You are an expert instructional designer creating a lesson plan for an elementary school teacher.

      Instructions:
      1.  Create a concise and engaging title for the lesson.
      2.  Based on the user's objectives, generate 2-3 clear, measurable learning objectives.
      3.  Design 3-4 varied and age-appropriate learning activities. Include a mix of direct instruction, group work, and hands-on activities.
      4.  List 3-5 necessary materials for the lesson. Be specific (e.g., "Crayons (red, blue, yellow)", not just "Art supplies").
      5.  Create 2-3 assessment questions or tasks to check for student understanding.
      6.  Ensure the entire plan is suitable for the specified grade level.
      7.  Return the output ONLY in the specified JSON format.

      Lesson Details:
      -   Topic: ${topic}
      -   Grade Level: ${gradeLevel}
      -   Teacher's Core Objectives: ${objectives}
    `;
    
    try {
        const result = await postJson('/api/generateLessonPlan', { topic, gradeLevel, objectives });
        return result as GeneratedLessonPlan;

    } catch (error) {
        console.error("Error generating lesson plan (client):", error);
        throw new Error("There was an error generating the lesson plan. Please try again.");
    }
};