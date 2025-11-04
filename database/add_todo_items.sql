-- Todo Items & Timesheet-Todo Relationships
-- Adds todo items functionality with project-based organization

-- Todo Items table
CREATE TABLE todo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    position INTEGER DEFAULT 0, -- For ordering within project/status
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for many-to-many relationship between timesheets and todo items
-- Also tracks hours allocated per todo within a timesheet
CREATE TABLE timesheet_todo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID REFERENCES timesheets(id) ON DELETE CASCADE NOT NULL,
    todo_item_id UUID REFERENCES todo_items(id) ON DELETE CASCADE NOT NULL,
    hours_allocated NUMERIC(5,2) NOT NULL CHECK (hours_allocated > 0 AND hours_allocated <= 24),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timesheet_id, todo_item_id) -- Prevent duplicate associations
);

-- Indexes for performance
CREATE INDEX idx_todo_items_project_id ON todo_items(project_id);
CREATE INDEX idx_todo_items_workspace_id ON todo_items(workspace_id);
CREATE INDEX idx_todo_items_status ON todo_items(status);
CREATE INDEX idx_todo_items_is_archived ON todo_items(is_archived);
CREATE INDEX idx_timesheet_todo_items_timesheet_id ON timesheet_todo_items(timesheet_id);
CREATE INDEX idx_timesheet_todo_items_todo_item_id ON timesheet_todo_items(todo_item_id);

-- Trigger for updated_at on todo_items
CREATE TRIGGER update_todo_items_updated_at 
    BEFORE UPDATE ON todo_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE todo_items IS 'Todo items (tasks) linked to projects';
COMMENT ON TABLE timesheet_todo_items IS 'Many-to-many relationship between timesheets and todo items with hours allocation';

