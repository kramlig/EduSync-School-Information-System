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
-- STEP 1: CREATE 45 DEMO TEACHERS (for pagination testing)
-- ==========================================

WITH school AS (SELECT id FROM schools WHERE name = 'Demo School' LIMIT 1),
     learning_areas AS (
       SELECT id, name,
              ROW_NUMBER() OVER (ORDER BY name) as la_num
       FROM learning_areas
       WHERE school_id = (SELECT id FROM school)
       LIMIT 10 -- Get first 10 learning areas
     ),
     teacher_data AS (
       SELECT 
         rn,
         first_name,
         last_name,
         role,
         contact_number,
         email
       FROM (VALUES 
         (1, 'Roberto', 'Santos', 'principal', '+63 917 123 4501', 'roberto.santos@demo.edu.ph'),
         (2, 'Maria', 'Cruz', 'registrar', '+63 917 123 4502', 'maria.cruz@demo.edu.ph'),
         (3, 'Juan', 'Reyes', 'teacher', '+63 917 123 4503', 'juan.reyes@demo.edu.ph'),
         (4, 'Elena', 'Garcia', 'teacher', '+63 917 123 4504', 'elena.garcia@demo.edu.ph'),
         (5, 'Pedro', 'Villanueva', 'teacher', '+63 917 123 4505', 'pedro.villanueva@demo.edu.ph'),
         (6, 'Carmen', 'Mendoza', 'teacher', '+63 917 123 4506', 'carmen.mendoza@demo.edu.ph'),
         (7, 'Antonio', 'Lopez', 'teacher', '+63 917 123 4507', 'antonio.lopez@demo.edu.ph'),
         (8, 'Rosa', 'Aquino', 'teacher', '+63 917 123 4508', 'rosa.aquino@demo.edu.ph'),
         (9, 'Manuel', 'Ramos', 'teacher', '+63 917 123 4509', 'manuel.ramos@demo.edu.ph'),
         (10, 'Teresa', 'Fernandez', 'teacher', '+63 917 123 4510', 'teresa.fernandez@demo.edu.ph'),
         (11, 'Francisco', 'Torres', 'teacher', '+63 917 123 4511', 'francisco.torres@demo.edu.ph'),
         (12, 'Luz', 'Flores', 'teacher', '+63 917 123 4512', 'luz.flores@demo.edu.ph'),
         (13, 'Miguel', 'Domingo', 'teacher', '+63 917 123 4513', 'miguel.domingo@demo.edu.ph'),
         (14, 'Ana', 'Rivera', 'teacher', '+63 917 123 4514', 'ana.rivera@demo.edu.ph'),
         (15, 'Jose', 'Martinez', 'teacher', '+63 917 123 4515', 'jose.martinez@demo.edu.ph'),
         (16, 'Lourdes', 'Gonzales', 'teacher', '+63 917 123 4516', 'lourdes.gonzales@demo.edu.ph'),
         (17, 'Ricardo', 'Perez', 'teacher', '+63 917 123 4517', 'ricardo.perez@demo.edu.ph'),
         (18, 'Cristina', 'Bautista', 'teacher', '+63 917 123 4518', 'cristina.bautista@demo.edu.ph'),
         (19, 'Ramon', 'De Leon', 'teacher', '+63 917 123 4519', 'ramon.deleon@demo.edu.ph'),
         (20, 'Gloria', 'Santiago', 'teacher', '+63 917 123 4520', 'gloria.santiago@demo.edu.ph'),
         (21, 'Fernando', 'Castro', 'teacher', '+63 917 123 4521', 'fernando.castro@demo.edu.ph'),
         (22, 'Lucia', 'Navarro', 'teacher', '+63 917 123 4522', 'lucia.navarro@demo.edu.ph'),
         (23, 'Carlos', 'Morales', 'teacher', '+63 917 123 4523', 'carlos.morales@demo.edu.ph'),
         (24, 'Isabel', 'Gutierrez', 'teacher', '+63 917 123 4524', 'isabel.gutierrez@demo.edu.ph'),
         (25, 'Rodrigo', 'Alvarez', 'teacher', '+63 917 123 4525', 'rodrigo.alvarez@demo.edu.ph'),
         (26, 'Patricia', 'Jimenez', 'teacher', '+63 917 123 4526', 'patricia.jimenez@demo.edu.ph'),
         (27, 'Eduardo', 'Salazar', 'teacher', '+63 917 123 4527', 'eduardo.salazar@demo.edu.ph'),
         (28, 'Angelica', 'Molina', 'teacher', '+63 917 123 4528', 'angelica.molina@demo.edu.ph'),
         (29, 'Gabriel', 'Valdez', 'teacher', '+63 917 123 4529', 'gabriel.valdez@demo.edu.ph'),
         (30, 'Beatriz', 'Romero', 'teacher', '+63 917 123 4530', 'beatriz.romero@demo.edu.ph'),
         (31, 'Alfredo', 'Ortiz', 'teacher', '+63 917 123 4531', 'alfredo.ortiz@demo.edu.ph'),
         (32, 'Victoria', 'Herrera', 'teacher', '+63 917 123 4532', 'victoria.herrera@demo.edu.ph'),
         (33, 'Rafael', 'Silva', 'teacher', '+63 917 123 4533', 'rafael.silva@demo.edu.ph'),
         (34, 'Marcela', 'Aguilar', 'teacher', '+63 917 123 4534', 'marcela.aguilar@demo.edu.ph'),
         (35, 'Leonardo', 'Miranda', 'teacher', '+63 917 123 4535', 'leonardo.miranda@demo.edu.ph'),
         (36, 'Rosario', 'Pascual', 'teacher', '+63 917 123 4536', 'rosario.pascual@demo.edu.ph'),
         (37, 'Ernesto', 'Vargas', 'teacher', '+63 917 123 4537', 'ernesto.vargas@demo.edu.ph'),
         (38, 'Josefina', 'Campos', 'teacher', '+63 917 123 4538', 'josefina.campos@demo.edu.ph'),
         (39, 'Enrique', 'Cortez', 'teacher', '+63 917 123 4539', 'enrique.cortez@demo.edu.ph'),
         (40, 'Dolores', 'Luna', 'teacher', '+63 917 123 4540', 'dolores.luna@demo.edu.ph'),
         (41, 'Arturo', 'Pena', 'teacher', '+63 917 123 4541', 'arturo.pena@demo.edu.ph'),
         (42, 'Remedios', 'Rios', 'teacher', '+63 917 123 4542', 'remedios.rios@demo.edu.ph'),
         (43, 'Salvador', 'Mejia', 'teacher', '+63 917 123 4543', 'salvador.mejia@demo.edu.ph'),
         (44, 'Concepcion', 'Suarez', 'teacher', '+63 917 123 4544', 'concepcion.suarez@demo.edu.ph'),
         (45, 'Alberto', 'Diaz', 'teacher', '+63 917 123 4545', 'alberto.diaz@demo.edu.ph')
       ) AS t(rn, first_name, last_name, role, contact_number, email)
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
    ELSE (
      SELECT jsonb_agg(
        jsonb_build_object(
          'gradeLevel', 'grade_' || (((td.rn - 3) % 6) + 1)::text,
          'learningAreaId', la.id::text,
          'learningAreaName', la.name
        )
      )
      FROM learning_areas la
      WHERE la.la_num <= (1 + (td.rn % 3)) -- Assign 1-3 learning areas
      LIMIT 3
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
SELECT '✅ Successfully seeded 45 teachers (1 principal, 1 registrar, 43 teachers) with learning area assignments!' as message;
