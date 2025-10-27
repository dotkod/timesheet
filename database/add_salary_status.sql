-- Add salary payment tracking for fixed billing projects
-- Create a separate table to track monthly salary credits
-- This allows tracking each month separately (Oct, Nov, Dec, etc.)

-- Create salary_credits table to track monthly salary payments
CREATE TABLE IF NOT EXISTS salary_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    work_month DATE NOT NULL, -- e.g., '2025-10-01' for October 2025
    credited_date DATE NOT NULL, -- e.g., '2025-11-07' when salary was credited
    amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_salary_credits_project_work_month 
ON salary_credits(project_id, work_month);

-- Add comment for clarity
COMMENT ON TABLE salary_credits IS 'Tracks monthly salary credits for fixed billing projects';
COMMENT ON COLUMN salary_credits.work_month IS 'The work month (first day of month) this payment is for';
COMMENT ON COLUMN salary_credits.credited_date IS 'When the salary was actually credited';
COMMENT ON COLUMN salary_credits.amount IS 'The credited amount (usually fixed_amount from project)';

