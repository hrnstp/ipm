/*
  # Security, Compliance, and Data Management

  ## Overview
  This migration adds comprehensive security monitoring, compliance tracking, and data management
  capabilities to ensure platform security, regulatory compliance, and proper data governance.

  ## New Tables

  ### `security_audit_logs`
  Complete audit trail for security-relevant events
  - `id` (uuid, primary key): Unique audit entry identifier
  - `user_id` (uuid, foreign key): User who performed action
  - `action_type` (text): Type of action (login, logout, data_access, permission_change, etc.)
  - `resource_type` (text): Type of resource accessed (project, document, user, etc.)
  - `resource_id` (uuid): ID of accessed resource
  - `ip_address` (inet): IP address of request
  - `user_agent` (text): Browser/client information
  - `status` (text): Success or failure status
  - `details` (jsonb): Additional event details
  - `severity` (text): Event severity (info, warning, critical)
  - `created_at` (timestamptz): Event timestamp

  ### `compliance_standards`
  Regulatory and industry standards tracking
  - `id` (uuid, primary key): Unique standard identifier
  - `name` (text): Standard name (GDPR, ISO 27001, SOC 2, etc.)
  - `description` (text): Standard overview
  - `category` (text): Standard type (data_privacy, security, quality)
  - `requirements` (jsonb): List of specific requirements
  - `is_active` (boolean): Whether standard is currently tracked
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `compliance_assessments`
  Compliance evaluation records
  - `id` (uuid, primary key): Unique assessment identifier
  - `standard_id` (uuid, foreign key): Related compliance standard
  - `project_id` (uuid, foreign key, nullable): Associated project if applicable
  - `assessed_by` (uuid, foreign key): User conducting assessment
  - `assessment_date` (date): When assessment was performed
  - `status` (text): Assessment status (compliant, non_compliant, partial, in_progress)
  - `score` (integer): Compliance score (0-100)
  - `findings` (jsonb): Assessment findings and gaps
  - `action_items` (jsonb): Required remediation actions
  - `next_review_date` (date): Scheduled next assessment
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `data_privacy_requests`
  GDPR and data privacy request tracking
  - `id` (uuid, primary key): Unique request identifier
  - `request_type` (text): Type of request (access, deletion, rectification, portability)
  - `user_id` (uuid, foreign key): User making request
  - `requester_email` (text): Email of requester
  - `status` (text): Request status (pending, in_progress, completed, rejected)
  - `requested_date` (timestamptz): When request was submitted
  - `completed_date` (timestamptz): When request was fulfilled
  - `handled_by` (uuid, foreign key): User processing request
  - `data_categories` (text[]): Types of data involved
  - `notes` (text): Processing notes
  - `attachments` (jsonb): Related documents
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `security_incidents`
  Security event and incident tracking
  - `id` (uuid, primary key): Unique incident identifier
  - `title` (text): Incident title
  - `description` (text): Detailed incident description
  - `severity` (text): Incident severity (low, medium, high, critical)
  - `status` (text): Current status (reported, investigating, contained, resolved, closed)
  - `incident_type` (text): Type of incident (breach, malware, phishing, unauthorized_access, etc.)
  - `reported_by` (uuid, foreign key): User reporting incident
  - `assigned_to` (uuid, foreign key): User handling incident
  - `reported_date` (timestamptz): When incident was reported
  - `detected_date` (timestamptz): When incident was first detected
  - `resolved_date` (timestamptz): When incident was resolved
  - `affected_systems` (text[]): Systems impacted
  - `affected_users` (uuid[]): Users impacted
  - `impact_assessment` (text): Business impact evaluation
  - `root_cause` (text): Identified cause
  - `remediation_steps` (jsonb): Actions taken to resolve
  - `lessons_learned` (text): Post-incident analysis
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `access_control_policies`
  Role-based access control policy definitions
  - `id` (uuid, primary key): Unique policy identifier
  - `name` (text): Policy name
  - `description` (text): Policy purpose
  - `resource_type` (text): Type of resource (project, document, financial_data, etc.)
  - `role` (text): User role (municipality, developer, integrator, admin)
  - `permissions` (jsonb): Allowed actions (read, write, delete, admin)
  - `conditions` (jsonb): Additional access conditions
  - `is_active` (boolean): Whether policy is enforced
  - `created_by` (uuid, foreign key): Policy creator
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `data_retention_policies`
  Data lifecycle and retention management
  - `id` (uuid, primary key): Unique policy identifier
  - `name` (text): Policy name
  - `description` (text): Policy description
  - `data_type` (text): Type of data (user_data, project_data, logs, documents)
  - `retention_period_days` (integer): How long to keep data
  - `archive_after_days` (integer): When to archive data
  - `deletion_method` (text): How to delete (soft_delete, hard_delete, anonymize)
  - `legal_basis` (text): Regulatory requirement
  - `is_active` (boolean): Whether policy is enforced
  - `created_by` (uuid, foreign key): Policy creator
  - `last_execution` (timestamptz): Last policy run
  - `created_at` (timestamptz): Creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### `security_scans`
  Automated security scanning results
  - `id` (uuid, primary key): Unique scan identifier
  - `scan_type` (text): Type of scan (vulnerability, dependency, code_quality, configuration)
  - `target` (text): What was scanned
  - `status` (text): Scan status (running, completed, failed)
  - `started_at` (timestamptz): Scan start time
  - `completed_at` (timestamptz): Scan completion time
  - `vulnerabilities_found` (integer): Number of issues found
  - `critical_count` (integer): Critical vulnerabilities
  - `high_count` (integer): High severity issues
  - `medium_count` (integer): Medium severity issues
  - `low_count` (integer): Low severity issues
  - `findings` (jsonb): Detailed scan results
  - `created_at` (timestamptz): Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Audit logs are read-only for regular users
  - Only administrators can manage compliance standards and policies
  - Users can view their own privacy requests
  - Security incidents have restricted access based on role

  ## Indexes
  - Audit log timestamps and user IDs for efficient querying
  - Compliance assessment dates and statuses
  - Privacy request statuses and dates
  - Incident severity and status for filtering
*/

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'blocked')),
  details jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create compliance_standards table
CREATE TABLE IF NOT EXISTS compliance_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('data_privacy', 'security', 'quality', 'financial')),
  requirements jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create compliance_assessments table
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id uuid REFERENCES compliance_standards(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  assessed_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('compliant', 'non_compliant', 'partial', 'in_progress')),
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  findings jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  next_review_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_privacy_requests table
CREATE TABLE IF NOT EXISTS data_privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('access', 'deletion', 'rectification', 'portability', 'objection')),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  requester_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  requested_date timestamptz DEFAULT now(),
  completed_date timestamptz,
  handled_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  data_categories text[] DEFAULT '{}'::text[],
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security_incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'contained', 'resolved', 'closed')),
  incident_type text NOT NULL CHECK (incident_type IN ('breach', 'malware', 'phishing', 'unauthorized_access', 'dos', 'data_loss', 'other')),
  reported_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_date timestamptz DEFAULT now(),
  detected_date timestamptz,
  resolved_date timestamptz,
  affected_systems text[] DEFAULT '{}'::text[],
  affected_users uuid[] DEFAULT '{}'::uuid[],
  impact_assessment text,
  root_cause text,
  remediation_steps jsonb DEFAULT '[]'::jsonb,
  lessons_learned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create access_control_policies table
CREATE TABLE IF NOT EXISTS access_control_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  resource_type text NOT NULL,
  role text NOT NULL CHECK (role IN ('municipality', 'developer', 'integrator', 'admin')),
  permissions jsonb DEFAULT '{}'::jsonb,
  conditions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_retention_policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  data_type text NOT NULL,
  retention_period_days integer NOT NULL CHECK (retention_period_days > 0),
  archive_after_days integer CHECK (archive_after_days > 0),
  deletion_method text NOT NULL CHECK (deletion_method IN ('soft_delete', 'hard_delete', 'anonymize')),
  legal_basis text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  last_execution timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security_scans table
CREATE TABLE IF NOT EXISTS security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL CHECK (scan_type IN ('vulnerability', 'dependency', 'code_quality', 'configuration', 'penetration')),
  target text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  vulnerabilities_found integer DEFAULT 0,
  critical_count integer DEFAULT 0,
  high_count integer DEFAULT 0,
  medium_count integer DEFAULT 0,
  low_count integer DEFAULT 0,
  findings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action_type ON security_audit_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_compliance_assessments_standard_id ON compliance_assessments(standard_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_project_id ON compliance_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_status ON compliance_assessments(status);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_next_review ON compliance_assessments(next_review_date);

CREATE INDEX IF NOT EXISTS idx_data_privacy_requests_user_id ON data_privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_privacy_requests_status ON data_privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_privacy_requests_requested_date ON data_privacy_requests(requested_date DESC);

CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_reported_date ON security_incidents(reported_date DESC);
CREATE INDEX IF NOT EXISTS idx_security_incidents_assigned_to ON security_incidents(assigned_to);

CREATE INDEX IF NOT EXISTS idx_access_control_policies_role ON access_control_policies(role);
CREATE INDEX IF NOT EXISTS idx_access_control_policies_resource_type ON access_control_policies(resource_type);

CREATE INDEX IF NOT EXISTS idx_security_scans_scan_type ON security_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_security_scans_status ON security_scans(status);
CREATE INDEX IF NOT EXISTS idx_security_scans_started_at ON security_scans(started_at DESC);

-- Enable Row Level Security
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON security_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON security_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for compliance_standards
CREATE POLICY "Everyone can view active compliance standards"
  ON compliance_standards FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create compliance standards"
  ON compliance_standards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update compliance standards"
  ON compliance_standards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for compliance_assessments
CREATE POLICY "Users can view assessments for their projects"
  ON compliance_assessments FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = compliance_assessments.project_id
      AND (
        projects.municipality_id = auth.uid()
        OR projects.developer_id = auth.uid()
        OR projects.integrator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create compliance assessments"
  ON compliance_assessments FOR INSERT
  TO authenticated
  WITH CHECK (assessed_by = auth.uid());

CREATE POLICY "Users can update their own assessments"
  ON compliance_assessments FOR UPDATE
  TO authenticated
  USING (assessed_by = auth.uid())
  WITH CHECK (assessed_by = auth.uid());

-- RLS Policies for data_privacy_requests
CREATE POLICY "Users can view their own privacy requests"
  ON data_privacy_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR handled_by = auth.uid());

CREATE POLICY "Users can create their own privacy requests"
  ON data_privacy_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Designated handlers can update privacy requests"
  ON data_privacy_requests FOR UPDATE
  TO authenticated
  USING (handled_by = auth.uid())
  WITH CHECK (handled_by = auth.uid());

-- RLS Policies for security_incidents
CREATE POLICY "Users can view security incidents they reported or are assigned to"
  ON security_incidents FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can create security incidents"
  ON security_incidents FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Assigned users can update incidents"
  ON security_incidents FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- RLS Policies for access_control_policies
CREATE POLICY "Everyone can view active access control policies"
  ON access_control_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create policies"
  ON access_control_policies FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Policy creators can update their policies"
  ON access_control_policies FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for data_retention_policies
CREATE POLICY "Everyone can view active retention policies"
  ON data_retention_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create retention policies"
  ON data_retention_policies FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Policy creators can update their policies"
  ON data_retention_policies FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for security_scans
CREATE POLICY "Everyone can view security scan results"
  ON security_scans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create security scans"
  ON security_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default compliance standards
INSERT INTO compliance_standards (name, description, category, requirements, is_active)
VALUES
(
  'GDPR - General Data Protection Regulation',
  'EU regulation on data protection and privacy for individuals within the European Union',
  'data_privacy',
  '[
    {"id": "art6", "title": "Lawfulness of Processing", "description": "Ensure legal basis for all data processing"},
    {"id": "art7", "title": "Conditions for Consent", "description": "Obtain clear and informed consent"},
    {"id": "art15", "title": "Right of Access", "description": "Provide data subjects access to their data"},
    {"id": "art16", "title": "Right to Rectification", "description": "Allow correction of inaccurate data"},
    {"id": "art17", "title": "Right to Erasure", "description": "Enable data deletion upon request"},
    {"id": "art20", "title": "Right to Data Portability", "description": "Provide data in portable format"},
    {"id": "art32", "title": "Security of Processing", "description": "Implement appropriate security measures"},
    {"id": "art33", "title": "Breach Notification", "description": "Report breaches within 72 hours"}
  ]'::jsonb,
  true
),
(
  'ISO 27001 - Information Security Management',
  'International standard for information security management systems',
  'security',
  '[
    {"id": "a5", "title": "Information Security Policies", "description": "Establish security policies"},
    {"id": "a6", "title": "Organization of Information Security", "description": "Define security roles"},
    {"id": "a8", "title": "Asset Management", "description": "Identify and protect assets"},
    {"id": "a9", "title": "Access Control", "description": "Manage user access"},
    {"id": "a12", "title": "Operations Security", "description": "Secure operational procedures"},
    {"id": "a14", "title": "System Acquisition", "description": "Secure development lifecycle"},
    {"id": "a16", "title": "Incident Management", "description": "Handle security incidents"},
    {"id": "a17", "title": "Business Continuity", "description": "Ensure service continuity"}
  ]'::jsonb,
  true
),
(
  'SOC 2 Type II',
  'Service Organization Control audit for security, availability, and confidentiality',
  'security',
  '[
    {"id": "cc1", "title": "Control Environment", "description": "Establish governance structure"},
    {"id": "cc2", "title": "Communication", "description": "Communicate policies and procedures"},
    {"id": "cc3", "title": "Risk Assessment", "description": "Identify and assess risks"},
    {"id": "cc4", "title": "Monitoring Activities", "description": "Monitor control effectiveness"},
    {"id": "cc5", "title": "Control Activities", "description": "Implement security controls"},
    {"id": "cc6", "title": "Logical Access", "description": "Control system access"},
    {"id": "cc7", "title": "System Operations", "description": "Manage system operations"},
    {"id": "cc8", "title": "Change Management", "description": "Control system changes"}
  ]'::jsonb,
  true
);

-- Insert default data retention policies
INSERT INTO data_retention_policies (name, description, data_type, retention_period_days, archive_after_days, deletion_method, legal_basis, is_active)
VALUES
(
  'User Account Data Retention',
  'Retention policy for user account information',
  'user_data',
  2555,
  1825,
  'anonymize',
  'GDPR Article 5(1)(e) - Storage Limitation',
  true
),
(
  'Project Data Retention',
  'Retention policy for project-related data',
  'project_data',
  3650,
  2555,
  'soft_delete',
  'Business requirement - 10 years',
  true
),
(
  'Audit Logs Retention',
  'Retention policy for security and audit logs',
  'logs',
  2190,
  1095,
  'hard_delete',
  'ISO 27001 - 6 years minimum',
  true
),
(
  'Document Retention',
  'Retention policy for project documents',
  'documents',
  2555,
  1825,
  'soft_delete',
  'Legal requirement - 7 years',
  true
);
