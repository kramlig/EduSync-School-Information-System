-- Backfill first_name/last_name from name column for students where they are empty
-- For students created via Personal Workspace StudentList which only had a single name field

-- Preview affected rows first:
-- SELECT id, name, first_name, last_name FROM students
-- WHERE (first_name IS NULL OR first_name = '') AND (last_name IS NULL OR last_name = '') AND name IS NOT NULL AND name != '';

-- Single-word names: put entire name in first_name
UPDATE students
SET first_name = name, last_name = ''
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND name IS NOT NULL AND name != ''
  AND name NOT LIKE '% %';

-- Multi-word names: last word becomes last_name, rest becomes first_name
UPDATE students
SET
  first_name = TRIM(LEFT(name, LENGTH(name) - LENGTH(SPLIT_PART(name, ' ', array_length(string_to_array(name, ' '), 1))) - 1)),
  last_name = SPLIT_PART(name, ' ', array_length(string_to_array(name, ' '), 1))
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND name IS NOT NULL AND name != ''
  AND name LIKE '% %';
