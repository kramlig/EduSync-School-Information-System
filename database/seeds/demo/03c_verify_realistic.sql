-- ============================================================================
-- VERIFICATION: Compare with Actual Division Data
-- Run after grades are seeded to verify realistic distribution
-- ============================================================================

-- 1. Division-wide summary (compare with actual: ~82.6% MPS, ~95.9% passing)
SELECT 
  'Division Summary' as report,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT g.student_id) as students,
  ROUND(AVG(g.q2), 2) as avg_mps_q2,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati';

-- 2. By District (actual data shows variance between Mati Central, North, South)
SELECT 
  s.district,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT g.student_id) as students,
  ROUND(AVG(g.q2), 2) as avg_mps,
  ROUND(STDDEV(g.q2), 2) as std_dev,
  ROUND(MIN(g.q2), 2) as min_grade,
  ROUND(MAX(g.q2), 2) as max_grade,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- 3. School-level variance (this should show wide range like actual data)
SELECT 
  s.name as school,
  COUNT(DISTINCT g.student_id) as students,
  ROUND(AVG(g.q2), 2) as avg_mps,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_rate,
  CASE 
    WHEN AVG(g.q2) >= 80 THEN 'HIGH'
    WHEN AVG(g.q2) >= 70 THEN 'MEDIUM'
    ELSE 'LOW'
  END as performance_tier
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.id, s.name
ORDER BY avg_mps DESC
LIMIT 30;

-- 4. Grade distribution buckets (should show wide variance, not uniform)
SELECT 
  CASE 
    WHEN q2 >= 90 THEN '90-100 (Outstanding)'
    WHEN q2 >= 85 THEN '85-89 (Very Satisfactory)'
    WHEN q2 >= 80 THEN '80-84 (Satisfactory)'
    WHEN q2 >= 75 THEN '75-79 (Fairly Satisfactory)'
    WHEN q2 >= 70 THEN '70-74 (DNME - Close)'
    WHEN q2 >= 60 THEN '60-69 (DNME - Far)'
    WHEN q2 >= 50 THEN '50-59 (Very Low)'
    ELSE 'Below 50 (Critical)'
  END as grade_bucket,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM grades g
JOIN schools s ON g.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY 1
ORDER BY 1 DESC;

-- 5. Sample schools comparison (similar to actual CSV data)
-- High performer example (like Onotan Daganio Tagbobolo ES: 77% passing, 86.67% MPS)
-- Medium example (like Mayor Santiago Garcia MS: 50% passing, 80.68% MPS)
-- Low example (like some rural schools: 20-40% passing, 50-65% MPS)
SELECT 
  s.name,
  la.code as subject,
  st.grade_level,
  ROUND(AVG(g.q2), 2) as mps,
  ROUND(COUNT(CASE WHEN g.q2 >= 75 THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as passing_pct
FROM grades g
JOIN schools s ON g.school_id = s.id
JOIN students st ON g.student_id = st.id
JOIN learning_areas la ON g.learning_area_id = la.id
WHERE s.division = 'Division of City of Mati'
  AND s.name IN ('Baso Elementary School', 'Onotan Daganio Tagbobolo ES', 'Mayor Santiago Garcia Memorial School')
GROUP BY s.name, la.code, st.grade_level
ORDER BY s.name, st.grade_level, la.code
LIMIT 50;
