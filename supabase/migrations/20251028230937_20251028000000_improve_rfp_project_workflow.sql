/*
  # Improve RFP to Project Workflow Integration

  ## Overview
  This migration improves the integration between RFPs, bids, and projects by adding
  proper foreign key relationships and workflow tracking.

  ## Changes
  
  1. Add RFP and bid references to projects table
  2. Add project reference to RFP requests
  3. Add status tracking for better workflow management
  4. Create helper views for integrated workflow

  ## New Columns

  ### `projects` table additions
  - `rfp_id` (uuid, foreign key): Link to originating RFP
  - `winning_bid_id` (uuid, foreign key): Link to winning bid

  ### `rfp_requests` table additions
  - `project_id` (uuid, foreign key): Link to created project
  - `selected_bid_id` (uuid, foreign key): Link to selected bid

  ### `bids` table additions
  - `project_id` (uuid, foreign key): Link to created project if bid wins
*/

-- Add columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'rfp_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN rfp_id uuid REFERENCES rfp_requests(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_rfp_id ON projects(rfp_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'winning_bid_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN winning_bid_id uuid REFERENCES bids(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_winning_bid_id ON projects(winning_bid_id);
  END IF;
END $$;

-- Add columns to rfp_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfp_requests' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE rfp_requests ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_rfp_requests_project_id ON rfp_requests(project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfp_requests' AND column_name = 'selected_bid_id'
  ) THEN
    ALTER TABLE rfp_requests ADD COLUMN selected_bid_id uuid REFERENCES bids(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_rfp_requests_selected_bid_id ON rfp_requests(selected_bid_id);
  END IF;
END $$;

-- Add columns to bids table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bids' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE bids ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
  END IF;
END $$;

-- Create view for integrated RFP workflow
CREATE OR REPLACE VIEW rfp_workflow_view AS
SELECT 
  r.id as rfp_id,
  r.title as rfp_title,
  r.status as rfp_status,
  r.deadline as rfp_deadline,
  r.budget_min,
  r.budget_max,
  r.created_by as municipality_id,
  r.created_at as rfp_created_at,
  COUNT(DISTINCT b.id) as bid_count,
  r.selected_bid_id,
  r.project_id,
  p.title as project_title,
  p.status as project_status,
  sb.developer_id as winning_developer_id,
  sb.price as winning_price
FROM rfp_requests r
LEFT JOIN bids b ON b.rfp_id = r.id
LEFT JOIN projects p ON p.id = r.project_id
LEFT JOIN bids sb ON sb.id = r.selected_bid_id
GROUP BY r.id, r.title, r.status, r.deadline, r.budget_min, r.budget_max, 
         r.created_by, r.created_at, r.selected_bid_id, r.project_id,
         p.title, p.status, sb.developer_id, sb.price;

-- Create view for project context (shows all related data)
CREATE OR REPLACE VIEW project_context_view AS
SELECT 
  p.id as project_id,
  p.title as project_title,
  p.status as project_status,
  p.phase as project_phase,
  p.start_date,
  p.estimated_completion as end_date,
  p.budget,
  p.municipality_id,
  p.developer_id,
  p.integrator_id,
  p.rfp_id,
  p.winning_bid_id,
  r.title as rfp_title,
  r.budget_min as rfp_budget_min,
  r.budget_max as rfp_budget_max,
  b.price as winning_bid_price,
  b.timeline as winning_bid_timeline,
  (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id) as task_count,
  (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id) as milestone_count,
  (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id) as document_count
FROM projects p
LEFT JOIN rfp_requests r ON r.id = p.rfp_id
LEFT JOIN bids b ON b.id = p.winning_bid_id;

-- Grant permissions on views
GRANT SELECT ON rfp_workflow_view TO authenticated;
GRANT SELECT ON project_context_view TO authenticated;

-- Add comments
COMMENT ON VIEW rfp_workflow_view IS 'Integrated view showing RFP workflow with bids and projects';
COMMENT ON VIEW project_context_view IS 'Comprehensive project view with all related entities';
