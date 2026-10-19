-- Add timestamp columns WITHOUT defaults before backfilling historical rows.
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;
UPDATE job_applications SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE job_applications SET status_updated_at = COALESCE(updated_at, created_at)
WHERE status_updated_at IS NULL;
ALTER TABLE job_applications ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE job_applications ALTER COLUMN status_updated_at SET NOT NULL;

-- Honor explicitly supplied historical created_at on future inserts too.
CREATE OR REPLACE FUNCTION initialize_application_timestamps() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := COALESCE(NEW.updated_at, NEW.created_at);
  NEW.status_updated_at := COALESCE(NEW.status_updated_at, NEW.created_at);
  RETURN NEW;
END;
$$;
-- Omitted values must reach the trigger as NULL, rather than migration/current time.
ALTER TABLE job_applications ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE job_applications ALTER COLUMN status_updated_at DROP DEFAULT;
CREATE OR REPLACE TRIGGER application_initial_timestamps
BEFORE INSERT ON job_applications FOR EACH ROW
EXECUTE FUNCTION initialize_application_timestamps();

ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_ghost_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ghost_years integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ghost_months integer NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ghost_weeks integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ghost_days integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS job_applications_ghosting_idx
ON job_applications (user_id, status_updated_at)
WHERE status IN ('applied', 'interviewing');
