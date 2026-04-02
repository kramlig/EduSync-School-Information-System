/**
 * Apply the missing parent_students FK constraint via direct PostgreSQL connection.
 */
const { Client } = require('pg');

const ref = 'ojahhzdibhfrjazgwvfw';
const pass = 'PvGvQfeeepbwJa9p';

async function main() {
  // Try multiple pooler regions until one works
  const regions = [
    'aws-0-ap-southeast-1',
    'aws-0-us-east-1', 
    'aws-0-us-west-1',
    'aws-0-eu-west-1',
    'aws-0-ap-northeast-1',
    'aws-0-ap-south-1',
    'aws-0-eu-central-1',
    'aws-0-us-west-2',
    'aws-0-sa-east-1',
  ];
  
  let client;
  let connected = false;
  
  for (const region of regions) {
    for (const port of [5432, 6543]) {
      const connStr = `postgresql://postgres.${ref}:${pass}@${region}.pooler.supabase.com:${port}/postgres`;
      console.log(`Trying ${region}:${port}...`);
      client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      try {
        await client.connect();
        console.log(`Connected via ${region}:${port}!`);
        connected = true;
        break;
      } catch (e) {
        console.log(`  Failed: ${e.message}`);
        try { await client.end(); } catch {}
      }
    }
    if (connected) break;
  }

  if (!connected) {
    console.error('Could not connect to any pooler region.');
    return;
  }

  try {
    // Check if FK already exists
    const check = await client.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_parent_students_parent' 
        AND table_name = 'parent_students'
    `);

    if (check.rows.length > 0) {
      console.log('FK fk_parent_students_parent already exists!');
    } else {
      console.log('Creating FK fk_parent_students_parent...');
      await client.query(`
        ALTER TABLE public.parent_students 
        ADD CONSTRAINT fk_parent_students_parent 
        FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE
      `);
      console.log('FK created successfully!');
    }

    // Also check/add FK for student_id
    const check2 = await client.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_parent_students_student' 
        AND table_name = 'parent_students'
    `);

    if (check2.rows.length > 0) {
      console.log('FK fk_parent_students_student already exists!');
    } else {
      console.log('Creating FK fk_parent_students_student...');
      await client.query(`
        ALTER TABLE public.parent_students 
        ADD CONSTRAINT fk_parent_students_student 
        FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
      `);
      console.log('FK fk_parent_students_student created successfully!');
    }

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('PostgREST schema cache reloaded');

    // Verify
    const verify = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'parent_students' AND constraint_type = 'FOREIGN KEY'
    `);
    console.log('Current FK constraints on parent_students:', verify.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
