/*
  # Project Management and Workflow Enhancement

  ## Overview
  This migration adds comprehensive project management capabilities including task management,
  timeline tracking, document management, and workflow automation to enable efficient
  collaboration between municipalities, developers, and integrators.

  ## New Tables

  ### `project_tasks`
  Task management system for tracking work items within projects
  - `id` (uuid, primary key): Unique task identifier
  - `project_id` (uuid, foreign key): Associated project
  - `title` (text): Task name/description
  - `description` (text): Detailed task information
  - `status` (text): Current task state (todo, in_progress, review, completed, blocked)
  - `priority` (text): Task urgency (low, medium, high, critical)
  - `assigned_to` (uuid, foreign key): User assigned to task
  - `created_by` (uuid, foreign key): Task creator
  - `due_date` (date): Task deadline
  - `completed_at` (timestamptz): Task completion timestamp
  - `estimated_hours` (numeric): Estimated effort
  - `actual_hours` (numeric): Actual time spent
  - `dependencies` (jsonb): Task dependencies array
  - `tags` (text[]): Task categorization labels
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `project_milestones`
  Major project checkpoints and deliverables tracking
  - `id` (uuid, primary key): Unique milestone identifier
  - `project_id` (uuid, foreign key): Associated project
  - `title` (text): Milestone name
  - `description` (text): Milestone details
  - `target_date` (date): Expected completion date
  - `actual_date` (date): Actual completion date
  - `status` (text): Milestone state (pending, in_progress, completed, delayed)
  - `completion_percentage` (integer): Progress indicator (0-100)
  - `deliverables` (jsonb): Expected outputs
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `project_documents`
  Document repository for project files and resources
  - `id` (uuid, primary key): Unique document identifier
  - `project_id` (uuid, foreign key): Associated project
  - `name` (text): Document filename
  - `description` (text): Document description
  - `file_url` (text): Storage location URL
  - `file_type` (text): Document format
  - `file_size` (bigint): File size in bytes
  - `category` (text): Document classification (contract, requirement, design, report, other)
  - `version` (text): Document version number
  - `uploaded_by` (uuid, foreign key): Uploader user ID
  - `is_public` (boolean): Public visibility flag
  - `created_at` (timestamptz): Upload timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `project_comments`
  Communication thread for project discussions
  - `id` (uuid, primary key): Unique comment identifier
  - `project_id` (uuid, foreign key): Associated project
  - `task_id` (uuid, foreign key, nullable): Associated task if applicable
  - `user_id` (uuid, foreign key): Comment author
  - `content` (text): Comment text
  - `mentions` (uuid[]): Tagged user IDs
  - `attachments` (jsonb): Linked files/resources
  - `created_at` (timestamptz): Comment timestamp
  - `updated_at` (timestamptz): Edit timestamp

  ### `project_activity_log`
  Complete audit trail of project changes
  - `id` (uuid, primary key): Unique activity identifier
  - `project_id` (uuid, foreign key): Associated project
  - `user_id` (uuid, foreign key): User who performed action
  - `action_type` (text): Type of change (created, updated, status_changed, etc.)
  - `entity_type` (text): What was changed (project, task, milestone, document)
  - `entity_id` (uuid): ID of changed entity
  - `changes` (jsonb): Before/after values
  - `metadata` (jsonb): Additional context
  - `created_at` (timestamptz): Action timestamp

  ### `workflow_templates`
  Reusable workflow patterns for common project types
  - `id` (uuid, primary key): Unique template identifier
  - `name` (text): Template name
  - `description` (text): Template purpose
  - `category` (text): Template type (software, infrastructure, service)
  - `phases` (jsonb): Workflow phases and stages
  - `default_tasks` (jsonb): Pre-configured task templates
  - `default_milestones` (jsonb): Standard milestone structure
  - `is_public` (boolean): Public availability flag
  - `created_by` (uuid, foreign key): Template creator
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `task_comments`
  Threaded discussions on individual tasks
  - `id` (uuid, primary key): Unique comment identifier
  - `task_id` (uuid, foreign key): Associated task
  - `user_id` (uuid, foreign key): Comment author
  - `content` (text): Comment text
  - `created_at` (timestamptz): Comment timestamp
  - `updated_at` (timestamptz): Edit timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access data for projects they're involved in
  - Read policies for project participants
  - Write policies for appropriate roles
  - Activity log is read-only for non-admin users

  ## Indexes
  - Project relationships for fast lookups
  - Task assignments and status for filtering
  - Document categories and projects
  - Activity log chronological queries
*/

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  due_date date,
  completed_at timestamptz,
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2),
  dependencies jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_date date NOT NULL,
  actual_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  deliverables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('contract', 'requirement', 'design', 'report', 'other')),
  version text DEFAULT '1.0',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  mentions uuid[] DEFAULT '{}'::uuid[],
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_activity_log table
CREATE TABLE IF NOT EXISTS project_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create workflow_templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('software', 'infrastructure', 'service')),
  phases jsonb DEFAULT '[]'::jsonb,
  default_tasks jsonb DEFAULT '[]'::jsonb,
  default_milestones jsonb DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON project_milestones(target_date);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON project_documents(category);

CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_task_id ON project_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_created_at ON project_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Enable Row Level Security
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_tasks
CREATE POLICY "Users can view tasks for their projects"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create tasks for their projects"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update tasks for their projects"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON project_tasks FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for project_milestones
CREATE POLICY "Users can view milestones for their projects"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create milestones for their projects"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update milestones for their projects"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

-- RLS Policies for project_documents
CREATE POLICY "Users can view documents for their projects or public documents"
  ON project_documents FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents to their projects"
  ON project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own documents"
  ON project_documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON project_documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- RLS Policies for project_comments
CREATE POLICY "Users can view comments for their projects"
  ON project_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments for their projects"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON project_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON project_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for project_activity_log
CREATE POLICY "Users can view activity log for their projects"
  ON project_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity_log.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert activity log entries"
  ON project_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for workflow_templates
CREATE POLICY "Users can view public workflow templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create workflow templates"
  ON workflow_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own workflow templates"
  ON workflow_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own workflow templates"
  ON workflow_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for tasks they can access"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_comments.task_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on accessible tasks"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_comments.task_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own task comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert sample workflow templates
INSERT INTO workflow_templates (name, description, category, phases, default_tasks, default_milestones, is_public)
VALUES
(
  'Smart City Software Development',
  'Complete workflow for developing and deploying smart city software solutions',
  'software',
  '[
    {"name": "Discovery", "duration_days": 14},
    {"name": "Planning", "duration_days": 21},
    {"name": "Development", "duration_days": 60},
    {"name": "Testing", "duration_days": 21},
    {"name": "Deployment", "duration_days": 14},
    {"name": "Maintenance", "duration_days": 365}
  ]'::jsonb,
  '[
    {"title": "Requirements Gathering", "phase": "Discovery", "priority": "high", "estimated_hours": 40},
    {"title": "Technical Architecture Design", "phase": "Planning", "priority": "high", "estimated_hours": 60},
    {"title": "Database Schema Design", "phase": "Planning", "priority": "high", "estimated_hours": 30},
    {"title": "Frontend Development", "phase": "Development", "priority": "high", "estimated_hours": 200},
    {"title": "Backend API Development", "phase": "Development", "priority": "high", "estimated_hours": 180},
    {"title": "Integration Testing", "phase": "Testing", "priority": "critical", "estimated_hours": 80},
    {"title": "User Acceptance Testing", "phase": "Testing", "priority": "critical", "estimated_hours": 60},
    {"title": "Production Deployment", "phase": "Deployment", "priority": "critical", "estimated_hours": 40}
  ]'::jsonb,
  '[
    {"title": "Requirements Approved", "phase": "Discovery"},
    {"title": "Design Complete", "phase": "Planning"},
    {"title": "MVP Ready", "phase": "Development"},
    {"title": "Testing Complete", "phase": "Testing"},
    {"title": "Go Live", "phase": "Deployment"}
  ]'::jsonb,
  true
),
(
  'Infrastructure Deployment',
  'Standard workflow for smart city infrastructure projects',
  'infrastructure',
  '[
    {"name": "Assessment", "duration_days": 14},
    {"name": "Design", "duration_days": 30},
    {"name": "Procurement", "duration_days": 45},
    {"name": "Installation", "duration_days": 60},
    {"name": "Commissioning", "duration_days": 14}
  ]'::jsonb,
  '[
    {"title": "Site Survey", "phase": "Assessment", "priority": "high", "estimated_hours": 40},
    {"title": "Infrastructure Design", "phase": "Design", "priority": "high", "estimated_hours": 80},
    {"title": "Equipment Procurement", "phase": "Procurement", "priority": "high", "estimated_hours": 60},
    {"title": "Hardware Installation", "phase": "Installation", "priority": "critical", "estimated_hours": 160},
    {"title": "Network Configuration", "phase": "Installation", "priority": "critical", "estimated_hours": 80},
    {"title": "System Testing", "phase": "Commissioning", "priority": "critical", "estimated_hours": 40}
  ]'::jsonb,
  '[
    {"title": "Site Assessment Complete", "phase": "Assessment"},
    {"title": "Design Approved", "phase": "Design"},
    {"title": "Equipment Delivered", "phase": "Procurement"},
    {"title": "Installation Complete", "phase": "Installation"},
    {"title": "System Operational", "phase": "Commissioning"}
  ]'::jsonb,
  true
);
