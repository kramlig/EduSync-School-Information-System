/**
 * Forms Service - Firestore Operations for DepEd Forms
 * 
 * Handles all CRUD operations for:
 * - Form 137 (Academic History / Permanent Record)
 * - Form 138 (Report Cards)
 * - School Forms (SF1, SF2, SF9)
 * - ELLN Assessments
 * - Form generation tracking and statistics
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';
import type {
  AcademicHistory,
  SchoolYearRecord,
  ReportCard,
  SchoolForm,
  ELLNAssessment,
  FormGenerationStatus
} from '../components/forms/shared/FormTypes';

// Get Firestore instance
const db = getFirestoreInstance();

// Collection names
const COLLECTIONS = {
  FORM137: 'academicHistory',
  FORM138: 'reportCards',
  SCHOOL_FORMS: 'schoolForms',
  ELLN: 'ellnAssessments',
  FORM_GENERATION: 'formGenerationLog'
} as const;

/**
 * Form 137 - Academic History / Permanent Record Operations
 */
export const Form137Service = {
  /**
   * Get all academic history records
   */
  async getAll(): Promise<AcademicHistory[]> {
    try {
      const q = query(collection(db, COLLECTIONS.FORM137));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AcademicHistory));
    } catch (error) {
      console.error('Error fetching all Form 137 records:', error);
      throw error;
    }
  },

  /**
   * Get academic history for a specific student
   * Returns ONE cumulative record (not array) per new Form 137 design
   */
  async getByStudentId(studentId: string): Promise<AcademicHistory | null> {
    console.log('[Form137Service.getByStudentId] Fetching for:', studentId);
    
    const q = query(
      collection(db, COLLECTIONS.FORM137),
      where('studentId', '==', studentId),
      limit(1) // Should only be one record per student
    );
    
    const snapshot = await getDocs(q);
    
    console.log('[Form137Service.getByStudentId] Snapshot empty?', snapshot.empty);
    console.log('[Form137Service.getByStudentId] Docs count:', snapshot.docs.length);
    
    if (snapshot.empty) {
      console.log('[Form137Service.getByStudentId] No record found');
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = {
      id: doc.id,
      ...doc.data()
    } as AcademicHistory;
    
    console.log('[Form137Service.getByStudentId] Found record:', {
      id: data.id,
      studentName: data.studentName,
      yearsCount: data.schoolYears?.length
    });
    
    return data;
  },

  /**
   * Get academic history for a specific school year
   */
  async getBySchoolYear(schoolYear: string): Promise<AcademicHistory[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.FORM137),
        where('schoolYear', '==', schoolYear)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AcademicHistory));
    } catch (error) {
      console.error('Error fetching Form 137 records by school year:', error);
      throw error;
    }
  },

  /**
   * Get single academic record
   */
  async getById(id: string): Promise<AcademicHistory | null> {
    const docRef = doc(db, COLLECTIONS.FORM137, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as AcademicHistory;
  },

  /**
   * Check if a Form 137 record already exists for a student
   * In the new cumulative design, there should only be one Form 137 per student
   */
  async exists(studentId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.FORM137),
        where('studentId', '==', studentId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : snapshot.docs[0].id;
    } catch (error) {
      console.error('Error checking Form 137 existence:', error);
      throw error;
    }
  },

  /**
   * Create new academic history record with first school year
   * Should only be called when student has no Form 137 yet
   */
  async create(data: Omit<AcademicHistory, 'id'>): Promise<string> {
    console.log('[Form137Service.create] Creating Form 137 for:', data.studentName);
    console.log('[Form137Service.create] Student ID:', data.studentId);
    console.log('[Form137Service.create] School years:', data.schoolYears?.length);
    
    // Check if student already has a Form 137
    const existingId = await this.exists(data.studentId);
    
    if (existingId) {
      console.error('[Form137Service.create] Record already exists:', existingId);
      throw new Error(
        `A Form 137 record already exists for this student (${data.studentName}). ` +
        `Use addSchoolYear() to add a new year instead of creating a new record.`
      );
    }
    
    console.log('[Form137Service.create] Adding document to Firestore...');
    const docRef = await addDoc(collection(db, COLLECTIONS.FORM137), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('[Form137Service.create] ✅ Created with ID:', docRef.id);
    return docRef.id;
  },

  /**
   * Add a new school year to an existing Form 137 record
   */
  async addSchoolYear(studentId: string, yearData: SchoolYearRecord): Promise<void> {
    const existingRecord = await this.getByStudentId(studentId);
    
    if (!existingRecord) {
      throw new Error(
        `No Form 137 found for student ${studentId}. Create a new Form 137 first.`
      );
    }

    // Check if this school year already exists
    const yearExists = existingRecord.schoolYears.some(
      yr => yr.schoolYear === yearData.schoolYear
    );

    if (yearExists) {
      throw new Error(
        `School year ${yearData.schoolYear} already exists in this student's Form 137. ` +
        `Use updateSchoolYear() to update it instead.`
      );
    }

    // Add new year to the array
    const updatedYears = [...existingRecord.schoolYears, yearData];

    // Update the document
    const docRef = doc(db, COLLECTIONS.FORM137, existingRecord.id);
    await updateDoc(docRef, {
      schoolYears: updatedYears,
      updatedAt: serverTimestamp(),
      updatedBy: yearData.recordedBy
    });
  },

  /**
   * Update an existing school year in a Form 137 record
   */
  async updateSchoolYear(
    studentId: string, 
    schoolYear: string, 
    yearData: Partial<SchoolYearRecord>
  ): Promise<void> {
    const existingRecord = await this.getByStudentId(studentId);
    
    if (!existingRecord) {
      throw new Error(`No Form 137 found for student ${studentId}.`);
    }

    // Find the year index
    const yearIndex = existingRecord.schoolYears.findIndex(
      yr => yr.schoolYear === schoolYear
    );

    if (yearIndex === -1) {
      throw new Error(
        `School year ${schoolYear} not found in this student's Form 137.`
      );
    }

    // Update the year data
    const updatedYears = [...existingRecord.schoolYears];
    updatedYears[yearIndex] = {
      ...updatedYears[yearIndex],
      ...yearData,
      recordedAt: new Date().toISOString()
    };

    // Update the document
    const docRef = doc(db, COLLECTIONS.FORM137, existingRecord.id);
    await updateDoc(docRef, {
      schoolYears: updatedYears,
      updatedAt: serverTimestamp(),
      updatedBy: yearData.recordedBy || existingRecord.updatedBy
    });
  },

  /**
   * Update existing academic history record
   */
  async update(id: string, data: Partial<AcademicHistory>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FORM137, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete academic history record
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FORM137, id);
    await deleteDoc(docRef);
  }
};

/**
 * Form 138 - Report Card Operations
 */
export const Form138Service = {
  /**
   * Get report cards for a specific student
   */
  async getByStudentId(studentId: string): Promise<ReportCard[]> {
    const q = query(
      collection(db, COLLECTIONS.FORM138),
      where('studentId', '==', studentId),
      orderBy('schoolYear', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReportCard));
  },

  /**
   * Get report cards for a school year and grade level
   */
  async getBySchoolYearAndGrade(schoolYear: string, gradeLevel: number): Promise<ReportCard[]> {
    const q = query(
      collection(db, COLLECTIONS.FORM138),
      where('schoolYear', '==', schoolYear),
      where('gradeLevel', '==', gradeLevel),
      orderBy('studentId', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReportCard));
  },

  /**
   * Get single report card
   */
  async getById(id: string): Promise<ReportCard | null> {
    const docRef = doc(db, COLLECTIONS.FORM138, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as ReportCard;
  },

  /**
   * Create new report card
   */
  async create(data: Omit<ReportCard, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.FORM138), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  },

  /**
   * Update existing report card
   */
  async update(id: string, data: Partial<ReportCard>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FORM138, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete report card
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FORM138, id);
    await deleteDoc(docRef);
  }
};

/**
 * School Forms (SF1, SF2, SF9) Operations
 */
export const SchoolFormsService = {
  /**
   * Get school forms by type and school year
   */
  async getByTypeAndYear(formType: 'SF1' | 'SF2' | 'SF9', schoolYear: string): Promise<SchoolForm[]> {
    const q = query(
      collection(db, COLLECTIONS.SCHOOL_FORMS),
      where('formType', '==', formType),
      where('schoolYear', '==', schoolYear),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SchoolForm));
  },

  /**
   * Get all school forms for a school year
   */
  async getBySchoolYear(schoolYear: string): Promise<SchoolForm[]> {
    const q = query(
      collection(db, COLLECTIONS.SCHOOL_FORMS),
      where('schoolYear', '==', schoolYear),
      orderBy('formType', 'asc'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SchoolForm));
  },

  /**
   * Get single school form
   */
  async getById(id: string): Promise<SchoolForm | null> {
    const docRef = doc(db, COLLECTIONS.SCHOOL_FORMS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as SchoolForm;
  },

  /**
   * Create new school form
   */
  async create(data: Omit<SchoolForm, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.SCHOOL_FORMS), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  },

  /**
   * Update existing school form
   */
  async update(id: string, data: Partial<SchoolForm>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SCHOOL_FORMS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete school form
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SCHOOL_FORMS, id);
    await deleteDoc(docRef);
  }
};

/**
 * ELLN Assessment Operations
 */
export const ELLNService = {
  /**
   * Get ELLN assessments for a specific student
   */
  async getByStudentId(studentId: string): Promise<ELLNAssessment[]> {
    const q = query(
      collection(db, COLLECTIONS.ELLN),
      where('studentId', '==', studentId),
      orderBy('assessmentDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ELLNAssessment));
  },

  /**
   * Get ELLN assessments for a grade level and school year
   */
  async getByGradeAndYear(gradeLevel: number, schoolYear: string): Promise<ELLNAssessment[]> {
    const q = query(
      collection(db, COLLECTIONS.ELLN),
      where('gradeLevel', '==', gradeLevel),
      where('schoolYear', '==', schoolYear),
      orderBy('assessmentDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ELLNAssessment));
  },

  /**
   * Get single ELLN assessment
   */
  async getById(id: string): Promise<ELLNAssessment | null> {
    const docRef = doc(db, COLLECTIONS.ELLN, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as ELLNAssessment;
  },

  /**
   * Create new ELLN assessment
   */
  async create(data: Omit<ELLNAssessment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.ELLN), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  },

  /**
   * Update existing ELLN assessment
   */
  async update(id: string, data: Partial<ELLNAssessment>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ELLN, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete ELLN assessment
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ELLN, id);
    await deleteDoc(docRef);
  }
};

/**
 * Form Generation Tracking
 * Tracks when forms are generated for analytics and audit purposes
 */
export const FormGenerationService = {
  /**
   * Log form generation event
   */
  async logGeneration(data: Omit<FormGenerationStatus, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.FORM_GENERATION), {
      ...data,
      timestamp: serverTimestamp()
    });
    
    return docRef.id;
  },

  /**
   * Get generation history for a specific form type
   */
  async getHistory(formType: string, limitCount: number = 50): Promise<FormGenerationStatus[]> {
    const q = query(
      collection(db, COLLECTIONS.FORM_GENERATION),
      where('formType', '==', formType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        formType: data.formType || '',
        status: data.status || 'pending',
        ...data
      } as FormGenerationStatus;
    });
  },

  /**
   * Get generation statistics for current month
   */
  async getMonthlyStats(): Promise<{
    form137: number;
    form138: number;
    schoolForms: number;
    elln: number;
    total: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const q = query(
      collection(db, COLLECTIONS.FORM_GENERATION),
      where('timestamp', '>=', Timestamp.fromDate(firstDayOfMonth))
    );
    
    const snapshot = await getDocs(q);
    const stats = {
      form137: 0,
      form138: 0,
      schoolForms: 0,
      elln: 0,
      total: 0
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const formType = data.formType as string;
      
      stats.total++;
      
      if (formType === 'Form 137') stats.form137++;
      else if (formType === 'Form 138') stats.form138++;
      else if (formType.startsWith('SF')) stats.schoolForms++;
      else if (formType === 'ELLN') stats.elln++;
    });
    
    return stats;
  }
};

/**
 * Utility function to check if a student has K-3 ELLN data
 */
export async function hasELLNData(studentId: string): Promise<boolean> {
  const assessments = await ELLNService.getByStudentId(studentId);
  return assessments.length > 0;
}

/**
 * Utility function to get the latest report card for a student
 */
export async function getLatestReportCard(studentId: string): Promise<ReportCard | null> {
  const reportCards = await Form138Service.getByStudentId(studentId);
  return reportCards.length > 0 ? reportCards[0] : null;
}

/**
 * Utility function to get complete academic history for a student
 * Returns the one cumulative Form 137 record for the student
 */
export async function getCompleteAcademicHistory(studentId: string): Promise<AcademicHistory | null> {
  return await Form137Service.getByStudentId(studentId);
}
