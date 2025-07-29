-- Optimized database indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_email_time 
ON sessions(user_email, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_scenario_id 
ON sessions(scenario_id) WHERE scenario_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_feedback_session_id 
ON session_feedback(session_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_category_difficulty 
ON scenarios(category, difficulty) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_search 
ON scenarios USING gin(to_tsvector('english', title || ' ' || description));

-- Optimized user sessions query
CREATE OR REPLACE FUNCTION get_optimized_user_sessions(user_email_param text, limit_param integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  duration_minutes integer,
  overall_score numeric,
  scenarios json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.start_time,
    s.end_time,
    s.duration_minutes,
    s.overall_score,
    json_build_object(
      'title', sc.title,
      'character_name', sc.character_name,
      'difficulty', sc.difficulty,
      'category', sc.category,
      'subcategory', sc.subcategory
    ) as scenarios
  FROM sessions s
  LEFT JOIN scenarios sc ON s.scenario_id = sc.id
  WHERE s.user_email = user_email_param
  ORDER BY s.start_time DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Full-text search function
CREATE OR REPLACE FUNCTION search_scenarios(
  search_term text,
  category_filter text DEFAULT 'all',
  difficulty_filter text DEFAULT 'all',
  limit_param integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  character_name text,
  character_role text,
  difficulty text,
  category text,
  subcategory text,
  tags text[],
  search_rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.character_name,
    s.character_role,
    s.difficulty,
    s.category,
    s.subcategory,
    s.tags,
    ts_rank(to_tsvector('english', s.title || ' ' || s.description), plainto_tsquery('english', search_term)) as search_rank
  FROM scenarios s
  WHERE s.is_active = true
    AND (category_filter = 'all' OR s.category = category_filter)
    AND (difficulty_filter = 'all' OR s.difficulty = difficulty_filter)
    AND (
      search_term = '' OR
      to_tsvector('english', s.title || ' ' || s.description) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY 
    CASE WHEN search_term = '' THEN 0 ELSE search_rank END DESC,
    s.difficulty,
    s.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;
