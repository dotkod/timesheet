-- Fix timesheet hours constraint to allow 0 hours
-- This allows for timesheet entries with 0 hours (useful for tracking non-billable activities)

-- Drop the existing constraint
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_hours_check;

-- Add new constraint that allows 0 hours but still prevents negative hours and hours > 24
ALTER TABLE timesheets ADD CONSTRAINT timesheets_hours_check 
    CHECK (hours >= 0 AND hours <= 24);

-- Add comment for clarity
COMMENT ON CONSTRAINT timesheets_hours_check ON timesheets IS 
    'Hours must be between 0 and 24 (allows 0 for non-billable activities)';
