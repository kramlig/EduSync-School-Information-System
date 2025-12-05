/**
 * SF6 Seeding Script - Textbook Distributions
 * Generates realistic textbook distribution data for testing
 */

import { faker } from '@faker-js/faker';

/**
 * Generate textbook distributions for testing
 * @param schoolId - School ID
 * @param students - Array of students
 * @param books - Array of books from SF3 seed
 * @param sections - Array of sections
 * @param schoolYear - Current school year (e.g., '2024-2025')
 * @param adminId - ID of the admin user for tracking
 */
export function generateTextbookDistributions(
  schoolId: string,
  students: any[],
  books: any[],
  sections: any[],
  schoolYear: string,
  adminId: string
) {
  const distributions: any[] = [];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'damaged', 'lost'];
  const statuses = ['issued', 'returned', 'lost', 'damaged', 'replaced'];

  // Helper to get random date in school year
  const getRandomDateInSchoolYear = (yearString: string, monthOffset = 0) => {
    const [startYear] = yearString.split('-').map(Number);
    const startDate = new Date(startYear, 7 + monthOffset, 1); // August + offset
    const endDate = new Date(startYear + 1, 3, 30); // April next year
    const randomTime =
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  };

  // Get textbooks (exclude reference books)
  const textbooks = books.filter(
    (b) => b.book_type === 'Textbook' && b.available_copies > 0
  );

  if (textbooks.length === 0) {
    console.warn('No textbooks available for distribution seeding');
    return [];
  }

  // Distribute books to active students
  const activeStudents = students.filter(
    (s) => s.status === 'active' || !s.status
  );

  activeStudents.forEach((student) => {
    // Each student gets 3-6 textbooks (one per subject they take)
    const booksToDistribute = faker.number.int({ min: 3, max: 6 });
    const studentBooks = faker.helpers.arrayElements(textbooks, booksToDistribute);
    const studentSection = sections.find((s) => s.id === student.section_id);

    studentBooks.forEach((book) => {
      const distributedDate = getRandomDateInSchoolYear(schoolYear);
      const conditionIssued = faker.helpers.arrayElement([
        'excellent',
        'good',
        'fair',
      ]);

      // 80% issued, 10% returned, 5% lost, 5% damaged
      const statusRoll = Math.random();
      let distributionStatus: string;
      let actualReturnDate: string | null = null;
      let conditionReturned: string | null = null;
      let amountCharged = 0;
      let paymentStatus = 'none';

      if (statusRoll < 0.8) {
        // Still issued
        distributionStatus = 'issued';
      } else if (statusRoll < 0.9) {
        // Returned
        distributionStatus = 'returned';
        actualReturnDate = getRandomDateInSchoolYear(schoolYear, 6); // Later in year
        
        // Condition may have degraded
        const conditionIndex = conditions.indexOf(conditionIssued);
        const maxDegradation = faker.number.int({ min: 0, max: 2 });
        const newConditionIndex = Math.min(
          conditionIndex + maxDegradation,
          conditions.length - 1
        );
        conditionReturned = conditions[newConditionIndex];
      } else if (statusRoll < 0.95) {
        // Lost
        distributionStatus = 'lost';
        amountCharged = book.price || faker.number.int({ min: 150, max: 800 });
        
        // 50% paid, 30% partial, 20% pending
        const paymentRoll = Math.random();
        if (paymentRoll < 0.5) {
          paymentStatus = 'paid';
        } else if (paymentRoll < 0.8) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'pending';
        }
      } else {
        // Damaged
        distributionStatus = 'damaged';
        actualReturnDate = getRandomDateInSchoolYear(schoolYear, 6);
        conditionReturned = 'damaged';
        amountCharged = (book.price || faker.number.int({ min: 150, max: 800 })) * 0.5; // 50% charge
        
        // 60% paid, 20% partial, 20% pending
        const paymentRoll = Math.random();
        if (paymentRoll < 0.6) {
          paymentStatus = 'paid';
        } else if (paymentRoll < 0.8) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'pending';
        }
      }

      const distribution = {
        id: faker.string.uuid(),
        school_id: schoolId,
        book_id: book.id,
        student_id: student.id,
        section_id: studentSection?.id || null,
        school_year: schoolYear,
        distributed_date: distributedDate,
        expected_return_date: getRandomDateInSchoolYear(schoolYear, 8), // End of year
        actual_return_date: actualReturnDate,
        condition_issued: conditionIssued,
        condition_returned: conditionReturned,
        distribution_status: distributionStatus,
        amount_charged: amountCharged,
        payment_status: paymentStatus,
        distributed_by: adminId,
        received_by: adminId,
        remarks: distributionStatus === 'lost' 
          ? 'Lost during field trip'
          : distributionStatus === 'damaged'
          ? 'Water damage from rain'
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      distributions.push(distribution);
    });
  });

  console.log(`Generated ${distributions.length} textbook distributions`);
  console.log(`- Issued: ${distributions.filter((d) => d.distribution_status === 'issued').length}`);
  console.log(`- Returned: ${distributions.filter((d) => d.distribution_status === 'returned').length}`);
  console.log(`- Lost: ${distributions.filter((d) => d.distribution_status === 'lost').length}`);
  console.log(`- Damaged: ${distributions.filter((d) => d.distribution_status === 'damaged').length}`);

  return distributions;
}

/**
 * Seed textbook distributions to Supabase
 */
export async function seedTextbookDistributions(
  supabase: any,
  distributions: any[]
) {
  console.log('Seeding textbook distributions...');

  try {
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < distributions.length; i += batchSize) {
      const batch = distributions.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('textbook_distributions')
        .insert(batch);

      if (error) {
        console.error(`Error seeding batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`Seeded batch ${i / batchSize + 1}/${Math.ceil(distributions.length / batchSize)}`);
    }

    console.log('✅ Textbook distributions seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed textbook distributions:', error);
    throw error;
  }
}

/**
 * Example usage in main seed script:
 * 
 * import { generateTextbookDistributions, seedTextbookDistributions } from './sf6-seed';
 * 
 * // After seeding students, books, sections:
 * const distributions = generateTextbookDistributions(
 *   schoolId,
 *   students,
 *   books,
 *   sections,
 *   '2024-2025',
 *   adminId
 * );
 * 
 * await seedTextbookDistributions(supabase, distributions);
 */
