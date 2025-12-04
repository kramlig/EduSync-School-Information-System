/**
 * Seed Books and Book Issuances Data for SF3 Testing
 * Run this after the database migration to populate test data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zjuxulhxxeeupcskkcok.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('Set it with: $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample book categories and subjects
const BOOK_CATEGORIES = ['Textbook', 'Workbook', 'Reference Book', 'Manual', 'Dictionary', 'Atlas'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'TLE', 'ESP'];
const CONDITIONS = ['Excellent', 'Good', 'Fair'];
const PUBLISHERS = ['Rex Bookstore', 'Phoenix Publishing', 'Vibal Group', 'Bookmark Inc.', 'Diwa Learning Systems'];

// Sample book titles by subject
const BOOK_TITLES = {
  'Mathematics': [
    'Mathematics for Grade 1', 'Math Workbook Grade 2', 'Fundamental Mathematics Grade 3',
    'Elementary Math Grade 4', 'Advanced Math Grade 5', 'Mathematics Mastery Grade 6',
    'Algebra Basics Grade 7', 'Geometry Fundamentals Grade 8', 'Advanced Algebra Grade 9',
    'Trigonometry Grade 10', 'Pre-Calculus Grade 11', 'Calculus Grade 12'
  ],
  'Science': [
    'Science Explorers Grade 1', 'Basic Science Grade 2', 'Science Adventures Grade 3',
    'Elementary Science Grade 4', 'Science Explorer Grade 5', 'General Science Grade 6',
    'Biology Basics Grade 7', 'Physics Introduction Grade 8', 'Chemistry Fundamentals Grade 9',
    'Earth Science Grade 10', 'Biology Advanced Grade 11', 'Physics & Chemistry Grade 12'
  ],
  'English': [
    'English for Beginners Grade 1', 'Reading and Writing Grade 2', 'English Grammar Grade 3',
    'Communication Arts Grade 4', 'Language Arts Grade 5', 'English Mastery Grade 6',
    'English Literature Grade 7', 'Composition and Grammar Grade 8', 'World Literature Grade 9',
    'Philippine Literature Grade 10', 'Contemporary Literature Grade 11', 'Advanced English Grade 12'
  ],
  'Filipino': [
    'Wika at Pagbasa Grade 1', 'Filipino sa Paaralan Grade 2', 'Sining ng Pagsulat Grade 3',
    'Filipino para sa Bata Grade 4', 'Wikang Filipino Grade 5', 'Panitikan at Gramatika Grade 6',
    'Filipino 7', 'Filipino 8', 'Filipino 9', 'Filipino 10', 'Sining ng Komunikasyon Grade 11', 'Panitikan ng Pilipinas Grade 12'
  ],
  'Araling Panlipunan': [
    'Ang Aking Bansa Grade 1', 'Kasaysayan ng Pilipinas Grade 2', 'Heograpiya Grade 3',
    'Kultura at Lipunan Grade 4', 'Pambansang Kasaysayan Grade 5', 'Philippine History Grade 6',
    'Asian Studies Grade 7', 'World History Grade 8', 'Economics Grade 9',
    'Philippine Government Grade 10', 'Philippine Politics Grade 11', 'Contemporary Issues Grade 12'
  ],
  'MAPEH': [
    'Music and Arts Grade 1', 'MAPEH Grade 2', 'Health and PE Grade 3',
    'MAPEH Activities Grade 4', 'Arts and Music Grade 5', 'MAPEH Integrated Grade 6',
    'MAPEH 7', 'MAPEH 8', 'MAPEH 9', 'MAPEH 10', 'Arts Appreciation Grade 11', 'Physical Education Grade 12'
  ],
  'TLE': [
    'Basic Skills Grade 4', 'Home Economics Grade 5', 'Technology Education Grade 6',
    'TLE 7', 'TLE 8', 'TLE 9', 'TLE 10', 'Entrepreneurship Grade 11', 'Business Management Grade 12'
  ],
  'ESP': [
    'Edukasyon sa Pagpapakatao Grade 1', 'ESP Grade 2', 'Values Education Grade 3',
    'ESP Grade 4', 'ESP Grade 5', 'ESP Grade 6', 'ESP 7', 'ESP 8', 'ESP 9', 'ESP 10'
  ]
};

async function seedBooksData() {
  try {
    console.log('🌱 Starting SF3 Books Data Seeding...\n');

    // Get the default school
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1);

    if (schoolError || !schools || schools.length === 0) {
      console.error('❌ No school found. Please ensure schools table has data.');
      return;
    }

    const schoolId = schools[0].id;
    const schoolName = schools[0].name;
    console.log(`📚 Seeding books for: ${schoolName} (${schoolId})\n`);

    // Get active students for book issuances
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, grade_level')
      .eq('school_id', schoolId)
      .in('grade_level', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .limit(50);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    console.log(`👥 Found ${students?.length || 0} students for book issuances\n`);

    // Create books
    const booksToCreate = [];
    let bookNumber = 1000;

    for (const [subject, titles] of Object.entries(BOOK_TITLES)) {
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const gradeLevel = i + 1;
        const totalCopies = Math.floor(Math.random() * 20) + 10; // 10-30 copies
        const category = subject === 'Mathematics' || subject === 'Science' || subject === 'English' 
          ? 'Textbook' 
          : (Math.random() > 0.5 ? 'Textbook' : 'Workbook');
        
        booksToCreate.push({
          school_id: schoolId,
          title: title,
          author: `DepEd-Approved Authors`,
          publisher: PUBLISHERS[Math.floor(Math.random() * PUBLISHERS.length)],
          isbn: `978-${Math.floor(Math.random() * 1000000000000)}`,
          book_number: `BK-${bookNumber++}`,
          category: category,
          subject: subject,
          grade_level: gradeLevel,
          total_copies: totalCopies,
          available_copies: totalCopies,
          condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
          created_by_name: 'System Seed',
        });
      }
    }

    console.log(`📖 Creating ${booksToCreate.length} books...`);
    
    const { data: createdBooks, error: booksError } = await supabase
      .from('books')
      .insert(booksToCreate)
      .select();

    if (booksError) {
      console.error('❌ Error creating books:', booksError);
      return;
    }

    console.log(`✅ Created ${createdBooks.length} books\n`);

    // Create book issuances (issue some books to students)
    if (students && students.length > 0 && createdBooks && createdBooks.length > 0) {
      const issuancesToCreate = [];
      const currentYear = new Date().getFullYear();
      const schoolYear = `${currentYear}-${currentYear + 1}`;

      // Issue books to students (matching grade level)
      for (const student of students) {
        const gradeBooks = createdBooks.filter(b => b.grade_level === student.grade_level);
        
        // Issue 2-4 books per student
        const numberOfBooks = Math.floor(Math.random() * 3) + 2;
        const selectedBooks = gradeBooks
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(numberOfBooks, gradeBooks.length));

        for (const book of selectedBooks) {
          if (book.available_copies > 0) {
            const issueDate = new Date();
            issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60)); // Issued 0-60 days ago
            
            const dueDate = new Date(issueDate);
            dueDate.setMonth(dueDate.getMonth() + 6); // 6 months lending period

            // 80% issued, 15% returned, 5% lost/damaged
            const statusRandom = Math.random();
            let status = 'issued';
            let returnDate = null;
            let conditionOnReturn = null;

            if (statusRandom > 0.95) {
              status = 'lost';
            } else if (statusRandom > 0.90) {
              status = 'damaged';
              returnDate = new Date(issueDate);
              returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 30));
              conditionOnReturn = 'Damaged';
            } else if (statusRandom > 0.80) {
              status = 'returned';
              returnDate = new Date(issueDate);
              returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 90));
              conditionOnReturn = CONDITIONS[Math.floor(Math.random() * 2)]; // Good or Fair
            }

            issuancesToCreate.push({
              school_id: schoolId,
              book_id: book.id,
              student_id: student.id,
              school_year: schoolYear,
              issue_date: issueDate.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
              return_date: returnDate ? returnDate.toISOString().split('T')[0] : null,
              status: status,
              condition_on_issue: book.condition,
              condition_on_return: conditionOnReturn,
              issued_by_name: 'Librarian',
              returned_to_name: returnDate ? 'Librarian' : null,
            });

            // Update available copies for issued books
            if (status === 'issued') {
              book.available_copies--;
            }
          }
        }
      }

      console.log(`📋 Creating ${issuancesToCreate.length} book issuances...`);
      
      const { data: createdIssuances, error: issuancesError } = await supabase
        .from('book_issuances')
        .insert(issuancesToCreate)
        .select();

      if (issuancesError) {
        console.error('❌ Error creating issuances:', issuancesError);
        return;
      }

      console.log(`✅ Created ${createdIssuances.length} book issuances\n`);

      // Update available_copies for all books that were issued
      const bookUpdates = createdBooks
        .filter(b => b.available_copies !== b.total_copies)
        .map(b => ({
          id: b.id,
          available_copies: b.available_copies
        }));

      if (bookUpdates.length > 0) {
        console.log(`🔄 Updating available copies for ${bookUpdates.length} books...`);
        
        for (const update of bookUpdates) {
          await supabase
            .from('books')
            .update({ available_copies: update.available_copies })
            .eq('id', update.id);
        }
        
        console.log(`✅ Updated available copies\n`);
      }
    }

    // Print summary statistics
    console.log('📊 SEEDING SUMMARY');
    console.log('═'.repeat(50));
    
    const { data: stats } = await supabase
      .from('books')
      .select('*')
      .eq('school_id', schoolId);
    
    const totalBooks = stats?.length || 0;
    const totalCopies = stats?.reduce((sum, b) => sum + b.total_copies, 0) || 0;
    const availableCopies = stats?.reduce((sum, b) => sum + b.available_copies, 0) || 0;
    const issuedCopies = totalCopies - availableCopies;

    const { data: issuanceStats } = await supabase
      .from('book_issuances')
      .select('status')
      .eq('school_id', schoolId);

    const activeIssuances = issuanceStats?.filter(i => i.status === 'issued').length || 0;
    const returnedIssuances = issuanceStats?.filter(i => i.status === 'returned').length || 0;
    const lostBooks = issuanceStats?.filter(i => i.status === 'lost').length || 0;
    const damagedBooks = issuanceStats?.filter(i => i.status === 'damaged').length || 0;

    console.log(`Total Books: ${totalBooks}`);
    console.log(`Total Copies: ${totalCopies}`);
    console.log(`Available: ${availableCopies}`);
    console.log(`Issued: ${issuedCopies}`);
    console.log(`\nIssuances:`);
    console.log(`  Active: ${activeIssuances}`);
    console.log(`  Returned: ${returnedIssuances}`);
    console.log(`  Lost: ${lostBooks}`);
    console.log(`  Damaged: ${damagedBooks}`);
    console.log('═'.repeat(50));
    console.log('\n✅ SF3 Books seeding complete!');
    console.log('\n🎯 You can now test SF3 at: /reports/sf3');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run the seeding
seedBooksData();
