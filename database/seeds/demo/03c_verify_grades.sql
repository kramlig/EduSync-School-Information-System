-- ============================================================================
-- VERIFICATION QUERIES FOR Q2 PROFICIENCY REPORT
-- Run AFTER all grades are seeded
-- ============================================================================

-- Grade distribution by proficiency level (Q2)
SELECT 
  CASE 
    WHEN q2 >= 90 THEN '1. Outstanding (90-100)'
    WHEN q2 >= 85 THEN '2. Very Satisfactory (85-89)'
    WHEN q2 >= 80 THEN '3. Satisfactory (80-84)'
    WHEN q2 >= 75 THEN '4. Fairly Satisfactory (75-79)'
    ELSE '5. Did Not Meet Expectations (<75)'
  END as proficiency_level,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 1;

-- Proficiency by district
SELECT 
  s.district,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT g.student_id) as students,
  COUNT(*) as total_grades,
  ROUND(AVG(g.q2), 2) as avg_q2_grade,
  ROUND(COUNT(CASE WHEN g.q2 >= 90 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as outstanding_pct,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Division summary
SELECT 
  'Division of City of Mati' as division,
  COUNT(DISTINCT s.id) as total_schools,
  COUNT(DISTINCT g.student_id) as students_with_grades,
  COUNT(*) as total_grade_records,
  ROUND(AVG(g.q1), 2) as division_avg_q1,
  ROUND(AVG(g.q2), 2) as division_avg_q2,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';
