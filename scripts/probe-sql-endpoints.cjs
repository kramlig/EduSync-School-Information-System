const ref = 'ojahhzdibhfrjazgwvfw';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYWhoemRpYmhmcmphemd3dmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NDY4OSwiZXhwIjoyMDkwNTMwNjg5fQ.L8zdFElsYcnMDyd3ggthhgzYxPrbFMwEcHV4_at6vZ4';

const sql = "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'parent_students' AND constraint_type = 'FOREIGN KEY'";

const headers = {
  'Content-Type': 'application/json',
  'apikey': key,
  'Authorization': 'Bearer ' + key
};

const paths = [
  '/pg-meta/default/query',
  '/rest/v1/rpc/query',
  '/pg/query',
];

async function main() {
  for (const p of paths) {
    try {
      const r = await fetch('https://' + ref + '.supabase.co' + p, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: sql })
      });
      const text = await r.text();
      console.log(p, '->', r.status, text.substring(0, 200));
    } catch (e) {
      console.log(p, '-> Error:', e.message);
    }
  }

  // Also try the management API 
  try {
    const r = await fetch('https://api.supabase.com/v1/projects/' + ref + '/database/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({ query: sql })
    });
    const text = await r.text();
    console.log('management API ->', r.status, text.substring(0, 200));
  } catch (e) {
    console.log('management API -> Error:', e.message);
  }
}

main();
