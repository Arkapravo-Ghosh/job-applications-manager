-- Requires pg_cron preloaded and cron.database_name set to this database.
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Named scheduling is idempotent for the application database role.
SELECT cron.schedule(
  'jobtrack-auto-ghosting',
  '0 0 * * *',
  'SELECT public.jobtrack_reconcile_all();'
);
