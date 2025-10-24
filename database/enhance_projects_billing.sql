-- Enhanced Projects table to support both hourly and fixed billing
-- Add billing type and fixed amount fields

-- First, add the new columns to existing projects table
ALTER TABLE projects 
ADD COLUMN billing_type TEXT DEFAULT 'hourly' CHECK (billing_type IN ('hourly', 'fixed')),
ADD COLUMN fixed_amount NUMERIC(10,2) DEFAULT 0;

-- Update existing projects to have hourly billing type
UPDATE projects SET billing_type = 'hourly' WHERE billing_type IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN projects.billing_type IS 'Billing type: hourly (based on timesheet hours) or fixed (monthly amount)';
COMMENT ON COLUMN projects.fixed_amount IS 'Fixed monthly amount for fixed billing type projects';
COMMENT ON COLUMN projects.hourly_rate IS 'Hourly rate for hourly billing type projects';

-- Example data for testing:
-- Hourly project example:
-- INSERT INTO projects (name, code, client_id, workspace_id, billing_type, hourly_rate) 
-- VALUES ('Website Development', 'WEB-001', 'client-uuid', 'workspace-uuid', 'hourly', 75.00);

-- Fixed project example:
-- INSERT INTO projects (name, code, client_id, workspace_id, billing_type, fixed_amount) 
-- VALUES ('Monthly Maintenance', 'MAINT-001', 'client-uuid', 'workspace-uuid', 'fixed', 2000.00);
