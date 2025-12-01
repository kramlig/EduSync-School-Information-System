-- ==========================================
-- SEED DEMO TEACHERS FOR DEMO SCHOOL
-- Quick script to add teacher data to existing database
-- Run this in Supabase SQL Editor
-- ==========================================

-- NOTE: This assumes you already have:
-- 1. School created
-- 2. Learning areas created
-- 3. Sections created

-- ==========================================
-- SAFETY: DELETE EXISTING DEMO TEACHERS FIRST
-- ==========================================
BEGIN;

-- Delete existing demo teachers (emails ending in @demo.edu.ph)
DELETE FROM teachers 
WHERE school_id = (SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1)
  AND email LIKE '%@demo.edu.ph';

-- ==========================================
-- STEP 1: CREATE 120 DEMO TEACHERS (for pagination testing)
-- ==========================================

WITH school AS (
  SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1
),
learning_areas AS (
  SELECT id, name,
         ROW_NUMBER() OVER (ORDER BY name) as la_num
  FROM learning_areas
  WHERE school_id = (SELECT id FROM school)
  LIMIT 10
),
-- Simple array of first names
first_names_array AS (
  SELECT ARRAY[
    'Roberto', 'Maria', 'Juan', 'Elena', 'Pedro', 'Carmen', 'Antonio', 'Rosa', 'Manuel', 'Teresa',
    'Francisco', 'Luz', 'Miguel', 'Ana', 'Jose', 'Lourdes', 'Ricardo', 'Cristina', 'Ramon', 'Gloria',
    'Fernando', 'Lucia', 'Carlos', 'Isabel', 'Rodrigo', 'Patricia', 'Eduardo', 'Angelica', 'Gabriel', 'Beatriz',
    'Alfredo', 'Victoria', 'Rafael', 'Marcela', 'Leonardo', 'Rosario', 'Ernesto', 'Josefina', 'Enrique', 'Dolores',
    'Arturo', 'Remedios', 'Salvador', 'Concepcion', 'Alberto', 'Milagros', 'Sergio', 'Esperanza', 'Jorge', 'Socorro',
    'Raul', 'Corazon', 'Javier', 'Teresita', 'Oscar', 'Anita', 'Luis', 'Celia', 'Mario', 'Nilda'
  ] as names
),
-- Simple array of last names
last_names_array AS (
  SELECT ARRAY[
    'Santos', 'Cruz', 'Reyes', 'Garcia', 'Villanueva', 'Mendoza', 'Lopez', 'Aquino', 'Ramos', 'Fernandez',
    'Torres', 'Flores', 'Domingo', 'Rivera', 'Martinez', 'Gonzales', 'Perez', 'Bautista', 'De Leon', 'Santiago',
    'Castro', 'Navarro', 'Morales', 'Gutierrez', 'Alvarez', 'Jimenez', 'Salazar', 'Molina', 'Valdez', 'Romero',
    'Ortiz', 'Herrera', 'Silva', 'Aguilar', 'Miranda', 'Pascual', 'Vargas', 'Campos', 'Cortez', 'Luna',
    'Pena', 'Rios', 'Mejia', 'Suarez', 'Diaz', 'Roque', 'Tan', 'Lim', 'Uy', 'Sy',
    'Go', 'Ng', 'Chua', 'Chan', 'Lee', 'Ang', 'Ong', 'Wong', 'Yu', 'Chiu'
  ] as names
),
teacher_data AS (
  SELECT 
    rn,
    CASE 
      WHEN rn = 1 THEN 'Roberto'
      WHEN rn = 2 THEN 'Maria'
      ELSE (SELECT names[(rn - 3) % 60 + 1] FROM first_names_array)
    END as first_name,
    CASE 
      WHEN rn = 1 THEN 'Santos'
      WHEN rn = 2 THEN 'Cruz'
      ELSE (SELECT names[(rn - 3) % 60 + 1] FROM last_names_array)
    END as last_name,
    CASE 
      WHEN rn = 1 THEN 'principal'
      WHEN rn = 2 THEN 'registrar'
      ELSE 'teacher'
    END as role,
    '+63 917 123 ' || LPAD(rn::text, 4, '0') as contact_number,
    CASE 
      WHEN rn = 1 THEN 'roberto.santos@demo.edu.ph'
      WHEN rn = 2 THEN 'maria.cruz@demo.edu.ph'
      ELSE 'teacher' || rn::text || '@demo.edu.ph'
    END as email
  FROM generate_series(1, 120) as rn
)
INSERT INTO teachers (school_id, name, email, contact_number, role, assignments)
SELECT 
  (SELECT id FROM school),
  td.first_name || ' ' || td.last_name,
  td.email,
  td.contact_number,
  td.role,
  CASE 
    -- Principal and Registrar: No assignments (administrative roles)
    WHEN td.rn IN (1, 2) THEN '[]'::jsonb
    -- Teachers: Assign 1-3 learning areas across different grade levels
    ELSE COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'gradeLevel', 'grade_' || (((td.rn - 3) % 6) + 1)::text,
            'learningAreaId', la.id::text,
            'learningAreaName', la.name
          )
        )
        FROM learning_areas la
        WHERE la.la_num <= (1 + (td.rn % 3))
      ),
      '[]'::jsonb
    )
  END
FROM teacher_data td;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Count teachers by role
SELECT 
  role,
  COUNT(*) as teacher_count
FROM teachers
WHERE school_id = (SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1)
GROUP BY role
ORDER BY role;

-- Show sample teachers with assignments
SELECT 
  name,
  email,
  role,
  jsonb_array_length(assignments) as assignment_count,
  assignments
FROM teachers
WHERE school_id = (SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1)
ORDER BY name
LIMIT 10;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT '✅ Successfully seeded 120 teachers (1 principal, 1 registrar, 118 teachers) with learning area assignments!' as message;

COMMIT;
