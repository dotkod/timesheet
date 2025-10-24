-- Timesheet & Invoice App Database Schema
-- Supabase PostgreSQL Database
-- Phase 2: Database Design

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces table
-- Separates different business entities (Dotkod Solutions, Sattiyan Selvarajah)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (for audit; only one admin account will be used)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_email TEXT,
    phone TEXT,
    billing_address TEXT,
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT,
    hourly_rate NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets table
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    description TEXT NOT NULL,
    billable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE,
    date_issued DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    template_id UUID, -- Will add foreign key constraint after invoice_templates table is created
    pdf_content TEXT, -- Store PDF as base64 string instead of URL
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice templates table (allow multiple per workspace)
CREATE TABLE invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    html_template TEXT, -- user editable HTML with placeholders
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace settings table
CREATE TABLE workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, key)
);

-- Workspace assets table (for logos, documents, etc.)
CREATE TABLE workspace_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'document', 'template')),
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content BYTEA NOT NULL, -- Store file content as binary data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for invoices.template_id after invoice_templates table is created
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_template_id 
    FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE SET NULL;

-- Indexes for better performance
CREATE INDEX idx_clients_workspace_id ON clients(workspace_id);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_timesheets_workspace_id ON timesheets(workspace_id);
CREATE INDEX idx_timesheets_project_id ON timesheets(project_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_invoices_workspace_id ON invoices(workspace_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_templates_workspace_id ON invoice_templates(workspace_id);
CREATE INDEX idx_workspace_settings_workspace_id ON workspace_settings(workspace_id);
CREATE INDEX idx_workspace_assets_workspace_id ON workspace_assets(workspace_id);
CREATE INDEX idx_workspace_assets_type ON workspace_assets(asset_type);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON invoice_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_assets_updated_at BEFORE UPDATE ON workspace_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_amount NUMERIC;
BEGIN
    SELECT COALESCE(SUM(total), 0) INTO total_amount
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;
    
    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(workspace_slug TEXT)
RETURNS TEXT AS $$
DECLARE
    current_year_month TEXT;
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    current_year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE workspace_slug || '-' || current_year_month || '-%';
    
    invoice_number := workspace_slug || '-' || current_year_month || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Seed data for initial workspaces
INSERT INTO workspaces (id, name, slug, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Dotkod Solutions', 'dotkod', 'Professional software development services'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Sattiyan Selvarajah', 'sattiyan', 'Personal freelance projects and consulting');

-- Seed default invoice template
INSERT INTO invoice_templates (workspace_id, name, html_template, is_default) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Standard Invoice', 
     '<div style="font-family: Inter, system-ui, -apple-system, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial;">
        <header style="margin-bottom: 2rem;">
          <h1>{{workspace.name}}</h1>
          <p>{{workspace.address}}</p>
        </header>
        <section style="margin-bottom: 2rem;">
          <h2>Invoice {{invoice.number}}</h2>
          <p><strong>To:</strong> {{client.name}}</p>
          <p><strong>Date:</strong> {{invoice.date}}</p>
          <p><strong>Due Date:</strong> {{invoice.due_date}}</p>
        </section>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{items_table}}
          </tbody>
        </table>
        <footer style="text-align: right;">
          <p><strong>Subtotal: ${{subtotal}}</strong></p>
          <p><strong>Tax: ${{tax}}</strong></p>
          <p><strong>Total: ${{total}}</strong></p>
        </footer>
      </div>', TRUE),
    ('550e8400-e29b-41d4-a716-446655440002', 'Standard Invoice', 
     '<div style="font-family: Inter, system-ui, -apple-system, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial;">
        <header style="margin-bottom: 2rem;">
          <h1>{{workspace.name}}</h1>
          <p>{{workspace.address}}</p>
        </header>
        <section style="margin-bottom: 2rem;">
          <h2>Invoice {{invoice.number}}</h2>
          <p><strong>To:</strong> {{client.name}}</p>
          <p><strong>Date:</strong> {{invoice.date}}</p>
          <p><strong>Due Date:</strong> {{invoice.due_date}}</p>
        </section>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #ddd; padding: 0.5rem; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{items_table}}
          </tbody>
        </table>
        <footer style="text-align: right;">
          <p><strong>Subtotal: ${{subtotal}}</strong></p>
          <p><strong>Tax: ${{tax}}</strong></p>
          <p><strong>Total: ${{total}}</strong></p>
        </footer>
      </div>', TRUE);

-- Seed default workspace settings
INSERT INTO workspace_settings (workspace_id, key, value) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'currency', 'USD'),
    ('550e8400-e29b-41d4-a716-446655440001', 'tax_rate', '10.0'),
    ('550e8400-e29b-41d4-a716-446655440001', 'invoice_prefix', 'INV'),
    ('550e8400-e29b-41d4-a716-446655440001', 'payment_terms', 'Net 30'),
    ('550e8400-e29b-41d4-a716-446655440002', 'currency', 'USD'),
    ('550e8400-e29b-41d4-a716-446655440002', 'tax_rate', '10.0'),
    ('550e8400-e29b-41d4-a716-446655440002', 'invoice_prefix', 'INV'),
    ('550e8400-e29b-41d4-a716-446655440002', 'payment_terms', 'Net 30');

-- Comments for documentation
COMMENT ON TABLE workspaces IS 'Business entities (Dotkod Solutions, Sattiyan Selvarajah)';
COMMENT ON TABLE clients IS 'Client information linked to workspaces';
COMMENT ON TABLE projects IS 'Projects linked to clients and workspaces';
COMMENT ON TABLE timesheets IS 'Time tracking entries';
COMMENT ON TABLE invoices IS 'Invoice records with line items';
COMMENT ON TABLE invoice_items IS 'Individual line items for invoices';
COMMENT ON TABLE invoice_templates IS 'Customizable invoice templates per workspace';
COMMENT ON TABLE workspace_settings IS 'Configuration settings per workspace';
COMMENT ON TABLE workspace_assets IS 'File assets (logos, documents) stored as binary data';
COMMENT ON TABLE users IS 'User accounts (single admin for now)';
