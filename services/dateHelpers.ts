/**
 * Date Helper Utilities
 * 
 * Provides utility functions for:
 * - School year formatting and parsing
 * - Quarter date ranges
 * - Academic calendar calculations
 * - Date formatting for DepEd forms
 */

/**
 * Get current school year in format "YYYY-YYYY"
 * School year starts in August (month 7, 0-indexed)
 */
export function getCurrentSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January)
  
  // If we're in August or later (month >= 7), school year is current-next
  // Otherwise, school year is previous-current
  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

/**
 * Parse school year string to get start and end years
 * 
 * @param schoolYear - School year string (e.g., "2024-2025")
 * @returns Object with startYear and endYear as numbers
 */
export function parseSchoolYear(schoolYear: string): { startYear: number; endYear: number } {
  const [startYear, endYear] = schoolYear.split('-').map(Number);
  return { startYear, endYear };
}

/**
 * Get next school year
 * 
 * @param schoolYear - Current school year (e.g., "2024-2025")
 * @returns Next school year (e.g., "2025-2026")
 */
export function getNextSchoolYear(schoolYear: string): string {
  const { startYear } = parseSchoolYear(schoolYear);
  return `${startYear + 1}-${startYear + 2}`;
}

/**
 * Get previous school year
 * 
 * @param schoolYear - Current school year (e.g., "2024-2025")
 * @returns Previous school year (e.g., "2023-2024")
 */
export function getPreviousSchoolYear(schoolYear: string): string {
  const { startYear } = parseSchoolYear(schoolYear);
  return `${startYear - 1}-${startYear}`;
}

/**
 * Check if a date falls within a school year
 * 
 * @param date - Date to check
 * @param schoolYear - School year string (e.g., "2024-2025")
 * @returns True if date is within the school year
 */
export function isDateInSchoolYear(date: Date, schoolYear: string): boolean {
  const { startYear, endYear } = parseSchoolYear(schoolYear);
  
  // School year runs from August startYear to July endYear
  const schoolYearStart = new Date(startYear, 7, 1); // August 1
  const schoolYearEnd = new Date(endYear, 6, 31); // July 31
  
  return date >= schoolYearStart && date <= schoolYearEnd;
}

/**
 * Quarter date ranges (approximate)
 * These are typical dates but may vary by school
 */
export interface QuarterDateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Get date ranges for all quarters in a school year
 * 
 * @param schoolYear - School year string (e.g., "2024-2025")
 * @returns Object with Q1, Q2, Q3, Q4 date ranges
 */
export function getQuarterDateRanges(schoolYear: string): {
  q1: QuarterDateRange;
  q2: QuarterDateRange;
  q3: QuarterDateRange;
  q4: QuarterDateRange;
} {
  const { startYear, endYear } = parseSchoolYear(schoolYear);
  
  return {
    q1: {
      start: new Date(startYear, 7, 1), // August 1
      end: new Date(startYear, 9, 31), // October 31
      label: 'First Quarter'
    },
    q2: {
      start: new Date(startYear, 10, 1), // November 1
      end: new Date(startYear, 11, 31), // December 31
      label: 'Second Quarter'
    },
    q3: {
      start: new Date(endYear, 0, 1), // January 1
      end: new Date(endYear, 2, 31), // March 31
      label: 'Third Quarter'
    },
    q4: {
      start: new Date(endYear, 3, 1), // April 1
      end: new Date(endYear, 5, 30), // June 30
      label: 'Fourth Quarter'
    }
  };
}

/**
 * Get current quarter based on current date
 * 
 * @param schoolYear - School year string (e.g., "2024-2025")
 * @returns Current quarter ('q1' | 'q2' | 'q3' | 'q4') or null if not in school year
 */
export function getCurrentQuarter(schoolYear: string): 'q1' | 'q2' | 'q3' | 'q4' | null {
  const now = new Date();
  const quarters = getQuarterDateRanges(schoolYear);
  
  if (now >= quarters.q1.start && now <= quarters.q1.end) return 'q1';
  if (now >= quarters.q2.start && now <= quarters.q2.end) return 'q2';
  if (now >= quarters.q3.start && now <= quarters.q3.end) return 'q3';
  if (now >= quarters.q4.start && now <= quarters.q4.end) return 'q4';
  
  return null;
}

/**
 * Format date for DepEd forms (Month DD, YYYY)
 * 
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "October 22, 2025")
 */
export function formatDepEdDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format date for form inputs (YYYY-MM-DD)
 * 
 * @param date - Date to format
 * @returns ISO date string
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get age as of a specific date
 * 
 * @param birthDate - Birth date
 * @param asOfDate - Date to calculate age as of (defaults to today)
 * @returns Age in years
 */
export function calculateAge(birthDate: Date | string, asOfDate?: Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const asOf = asOfDate || new Date();
  
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get school days between two dates (Monday-Friday only)
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of school days (weekdays)
 */
export function getSchoolDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Get total school days in a quarter
 * 
 * @param schoolYear - School year string
 * @param quarter - Quarter ('q1' | 'q2' | 'q3' | 'q4')
 * @returns Approximate number of school days
 */
export function getSchoolDaysInQuarter(
  schoolYear: string,
  quarter: 'q1' | 'q2' | 'q3' | 'q4'
): number {
  const quarters = getQuarterDateRanges(schoolYear);
  const quarterRange = quarters[quarter];
  
  return getSchoolDaysBetween(quarterRange.start, quarterRange.end);
}

/**
 * Get total school days in a school year
 * 
 * @param schoolYear - School year string
 * @returns Total number of school days (approximately 200)
 */
export function getTotalSchoolDays(schoolYear: string): number {
  const quarters = getQuarterDateRanges(schoolYear);
  
  return (
    getSchoolDaysBetween(quarters.q1.start, quarters.q1.end) +
    getSchoolDaysBetween(quarters.q2.start, quarters.q2.end) +
    getSchoolDaysBetween(quarters.q3.start, quarters.q3.end) +
    getSchoolDaysBetween(quarters.q4.start, quarters.q4.end)
  );
}

/**
 * Format quarter label
 * 
 * @param quarter - Quarter identifier
 * @returns Formatted label (e.g., "1st Quarter", "2nd Quarter")
 */
export function formatQuarterLabel(quarter: 'q1' | 'q2' | 'q3' | 'q4' | 'final'): string {
  const labels: Record<string, string> = {
    q1: '1st Quarter',
    q2: '2nd Quarter',
    q3: '3rd Quarter',
    q4: '4th Quarter',
    final: 'Final'
  };
  
  return labels[quarter] || quarter;
}

/**
 * Check if school year is valid format
 * 
 * @param schoolYear - School year string to validate
 * @returns True if valid format
 */
export function isValidSchoolYear(schoolYear: string): boolean {
  const pattern = /^\d{4}-\d{4}$/;
  if (!pattern.test(schoolYear)) return false;
  
  const { startYear, endYear } = parseSchoolYear(schoolYear);
  return endYear === startYear + 1;
}

/**
 * Get month name from number
 * 
 * @param month - Month number (1-12)
 * @returns Month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[month - 1] || '';
}

/**
 * Get short month name from number
 * 
 * @param month - Month number (1-12)
 * @returns Short month name (e.g., "Jan", "Feb")
 */
export function getShortMonthName(month: number): string {
  return getMonthName(month).substring(0, 3);
}

/**
 * Convert date to relative time (e.g., "2 days ago", "in 3 days")
 * 
 * @param date - Date to convert
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 0) return `${diffDays} days ago`;
  return `in ${Math.abs(diffDays)} days`;
}

/**
 * Get academic year from a regular date
 * Determines which school year a date belongs to
 * 
 * @param date - Date to check
 * @returns School year string
 */
export function getSchoolYearFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // If August or later, school year is current-next
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get range of school years for dropdown
 * 
 * @param yearsBack - How many years back to include (default: 5)
 * @param yearsForward - How many years forward to include (default: 2)
 * @returns Array of school year strings
 */
export function getSchoolYearOptions(yearsBack: number = 5, yearsForward: number = 2): string[] {
  const currentSchoolYear = getCurrentSchoolYear();
  const { startYear } = parseSchoolYear(currentSchoolYear);
  
  const options: string[] = [];
  
  for (let i = -yearsBack; i <= yearsForward; i++) {
    const year = startYear + i;
    options.push(`${year}-${year + 1}`);
  }
  
  return options;
}
