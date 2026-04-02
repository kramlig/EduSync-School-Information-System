const fs = require('fs');
const schemas = JSON.parse(fs.readFileSync('openapi_schema.json', 'utf8'));

// Map PostgREST/OpenAPI types to PostgreSQL types
function pgType(prop) {
  const fmt = prop.format || '';
  const type = prop.type || '';

  if (fmt === 'uuid') return 'UUID';
  if (fmt === 'timestamp with time zone' || fmt === 'timestamptz') return 'TIMESTAMPTZ';
  if (fmt === 'timestamp without time zone') return 'TIMESTAMP';
  if (fmt === 'date') return 'DATE';
  if (fmt === 'time without time zone') return 'TIME';
  if (fmt === 'bigint') return 'BIGINT';
  if (fmt === 'double precision') return 'DOUBLE PRECISION';
  if (fmt === 'real') return 'REAL';
  if (fmt === 'numeric') return 'NUMERIC';
  if (fmt === 'integer' || fmt === 'int4') return 'INTEGER';
  if (fmt === 'smallint' || fmt === 'int2') return 'SMALLINT';
  if (fmt === 'text') return 'TEXT';
  if (fmt === 'character varying') return 'TEXT';
  if (fmt === 'jsonb') return 'JSONB';
  if (fmt === 'json') return 'JSON';
  if (fmt === 'boolean') return 'BOOLEAN';
  if (fmt === 'bytea') return 'BYTEA';
  if (fmt === 'inet') return 'INET';
  if (fmt === 'interval') return 'INTERVAL';

  // Fall back to type field
  if (type === 'integer') return 'INTEGER';
  if (type === 'number') return 'NUMERIC';
  if (type === 'boolean') return 'BOOLEAN';
  if (type === 'string') return 'TEXT';
  if (type === 'array') {
    const items = prop.items || {};
    if (items.type === 'string') return 'TEXT[]';
    if (items.type === 'integer') return 'INTEGER[]';
    if (items.type === 'number') return 'NUMERIC[]';
    if (items.type === 'object') return 'JSONB[]';
    return 'JSONB';
  }
  if (type === 'object') return 'JSONB';

  return 'TEXT';
}

function defaultVal(prop) {
  if (prop.default === undefined || prop.default === null) return '';
  const d = String(prop.default);
  if (d === 'gen_random_uuid()') return ' DEFAULT gen_random_uuid()';
  if (d === 'now()' || d === 'CURRENT_TIMESTAMP') return ' DEFAULT now()';
  if (d === 'CURRENT_DATE') return ' DEFAULT CURRENT_DATE';
  if (d === 'true' || d === 'false') return ' DEFAULT ' + d;
  if (/^[0-9.\-]+$/.test(d)) return ' DEFAULT ' + d;
  if (d.startsWith("'")) return ' DEFAULT ' + d;
  // Handle enum defaults with :: cast
  if (d.includes('::')) return ' DEFAULT ' + d;
  return " DEFAULT '" + d + "'";
}

let sql = '-- Auto-generated DDL from OpenAPI schema\n';
sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

const tableNames = Object.keys(schemas).sort();
for (const tbl of tableNames) {
  const def = schemas[tbl];
  const props = def.properties || {};
  const required = new Set(def.required || []);

  sql += 'CREATE TABLE IF NOT EXISTS public."' + tbl + '" (\n';
  const colLines = [];
  const cols = Object.keys(props);
  for (const col of cols) {
    const p = props[col];
    let line = '  "' + col + '" ' + pgType(p);

    // Check if primary key
    const desc = p.description || '';
    if (desc.includes('<pk/>')) {
      line += ' PRIMARY KEY';
    }

    line += defaultVal(p);

    // NOT NULL for required fields (except PK which already implies it)
    if (required.has(col) && !desc.includes('<pk/>')) {
      line += ' NOT NULL';
    }

    colLines.push(line);
  }
  sql += colLines.join(',\n');
  sql += '\n);\n\n';
}

fs.writeFileSync('schema_ddl.sql', sql);
console.log('Generated DDL for', tableNames.length, 'tables');
console.log('File size:', fs.statSync('schema_ddl.sql').size, 'bytes');
