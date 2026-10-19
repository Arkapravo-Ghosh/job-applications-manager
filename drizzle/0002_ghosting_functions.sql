-- Capture the migration's schema so cron and application requests use the same
-- tables even if the caller has a different search_path. Functions run with
-- caller privileges; they do not grant database access to web users.
CREATE OR REPLACE FUNCTION jobtrack_ghosting_deadline(
  status_time timestamptz, update_time timestamptz, creation_time timestamptz,
  years_count integer, months_count integer, weeks_count integer, days_count integer
) RETURNS timestamptz
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path FROM CURRENT
AS $$
  SELECT ((COALESCE(status_time, update_time, creation_time) AT TIME ZONE 'UTC')
    + make_interval(months => years_count * 12 + months_count)
    + make_interval(days => weeks_count * 7 + days_count)) AT TIME ZONE 'UTC';
$$;

CREATE OR REPLACE FUNCTION jobtrack_reconcile_user(target_user uuid)
RETURNS integer LANGUAGE plpgsql
SET search_path FROM CURRENT
AS $$
DECLARE
  batch_count integer;
  changed_count integer := 0;
BEGIN
  -- Serialize against settings changes; skip jobs being edited elsewhere.
  PERFORM id FROM users WHERE id = target_user AND auto_ghost_enabled FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR batch IN 1..4 LOOP
    WITH due AS (
      SELECT j.id FROM job_applications j JOIN users u ON u.id = j.user_id
      WHERE u.id = target_user AND u.auto_ghost_enabled
        AND j.status IN ('applied', 'interviewing')
        AND jobtrack_ghosting_deadline(j.status_updated_at, j.updated_at, j.created_at,
          u.ghost_years, u.ghost_months, u.ghost_weeks, u.ghost_days) <= CURRENT_TIMESTAMP
      ORDER BY j.status_updated_at, j.id
      LIMIT 500 FOR UPDATE OF j SKIP LOCKED
    )
    UPDATE job_applications j SET status = 'ghosted',
      updated_at = CURRENT_TIMESTAMP, status_updated_at = CURRENT_TIMESTAMP
    FROM due WHERE j.id = due.id;
    GET DIAGNOSTICS batch_count = ROW_COUNT;
    changed_count := changed_count + batch_count;
    EXIT WHEN batch_count < 500;
  END LOOP;
  RETURN changed_count;
END;
$$;

CREATE OR REPLACE FUNCTION jobtrack_reconcile_all()
RETURNS TABLE(changed integer, users_checked integer, may_have_more boolean)
LANGUAGE plpgsql
SET search_path FROM CURRENT
AS $$
DECLARE
  target_user uuid;
  user_count integer;
BEGIN
  changed := 0;
  users_checked := 0;
  may_have_more := false;
  FOR target_user IN
    SELECT DISTINCT u.id FROM users u JOIN job_applications j ON j.user_id = u.id
    WHERE u.auto_ghost_enabled AND j.status IN ('applied', 'interviewing')
      AND jobtrack_ghosting_deadline(j.status_updated_at, j.updated_at, j.created_at,
        u.ghost_years, u.ghost_months, u.ghost_weeks, u.ghost_days) <= CURRENT_TIMESTAMP
    ORDER BY u.id LIMIT 100
  LOOP
    user_count := jobtrack_reconcile_user(target_user);
    changed := changed + user_count;
    users_checked := users_checked + 1;
    may_have_more := may_have_more OR user_count = 2000;
  END LOOP;
  may_have_more := may_have_more OR users_checked = 100;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION jobtrack_ghosting_deadline(timestamptz,timestamptz,timestamptz,integer,integer,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION jobtrack_reconcile_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION jobtrack_reconcile_all() FROM PUBLIC;
