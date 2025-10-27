/*
  # Marketplace and Procurement Features

  1. New Tables
    - `rfp_requests` (Request for Proposals)
      - `id` (uuid, primary key)
      - `municipality_id` (uuid, foreign key to municipalities)
      - `created_by` (uuid, foreign key to profiles)
      - `title` (text) - RFP title
      - `description` (text) - Full requirements
      - `category` (text) - Solution category
      - `budget_min` (numeric)
      - `budget_max` (numeric)
      - `currency` (text)
      - `deadline` (timestamptz) - Submission deadline
      - `requirements` (jsonb) - Technical and other requirements
      - `evaluation_criteria` (jsonb) - Scoring criteria
      - `status` (text) - draft, published, closed, awarded
      - `selected_bid_id` (uuid) - Winning bid
      - `published_at` (timestamptz)
      - `closed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bids`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfp_requests)
      - `developer_id` (uuid, foreign key to profiles)
      - `solution_id` (uuid, foreign key to smart_solutions)
      - `proposal_text` (text) - Detailed proposal
      - `price` (numeric) - Bid amount
      - `currency` (text)
      - `timeline` (text) - Implementation timeline
      - `technical_approach` (text)
      - `team_details` (jsonb) - Team composition
      - `attachments` (jsonb) - Document links
      - `status` (text) - draft, submitted, under_review, accepted, rejected, withdrawn
      - `submitted_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `vendor_ratings`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to profiles) - Developer being rated
      - `rated_by` (uuid, foreign key to profiles) - Municipality rating
      - `project_id` (uuid, foreign key to projects)
      - `overall_rating` (integer) - 1-5 stars
      - `quality_rating` (integer)
      - `timeline_rating` (integer)
      - `communication_rating` (integer)
      - `support_rating` (integer)
      - `review_text` (text)
      - `would_recommend` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contract_templates`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text) - software, hardware, services, etc.
      - `template_content` (text) - Contract template text
      - `variables` (jsonb) - Template variables
      - `is_public` (boolean)
      - `created_by` (uuid, foreign key to profiles)
      - `usage_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_marketplace`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to profiles)
      - `service_type` (text) - consulting, training, maintenance, etc.
      - `title` (text)
      - `description` (text)
      - `price_model` (text) - hourly, fixed, monthly
      - `price_amount` (numeric)
      - `currency` (text)
      - `categories` (text[])
      - `regions_served` (text[])
      - `certifications` (text[])
      - `portfolio` (jsonb) - Past work examples
      - `status` (text) - active, paused, inactive
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Municipalities can create and manage RFPs
    - Developers can view published RFPs and submit bids
    - Only relevant parties can view bid details
    - Anyone can view vendor ratings
    - Service providers can manage their marketplace listings

  3. Indexes
    - Add indexes for foreign keys and status fields
    - Add indexes for deadline and date-based queries
*/

-- RFP Requests Table
CREATE TABLE IF NOT EXISTS rfp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid REFERENCES municipalities(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'USD',
  deadline timestamptz,
  requirements jsonb DEFAULT '{}',
  evaluation_criteria jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  selected_bid_id uuid,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rfp_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published RFPs"
  ON rfp_requests FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Municipality users can create RFPs"
  ON rfp_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'municipality'
    )
  );

CREATE POLICY "Creator can update their RFPs"
  ON rfp_requests FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can delete their RFPs"
  ON rfp_requests FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid REFERENCES rfp_requests(id) ON DELETE CASCADE NOT NULL,
  developer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  solution_id uuid REFERENCES smart_solutions(id) ON DELETE SET NULL,
  proposal_text text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  timeline text,
  technical_approach text,
  team_details jsonb DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFP creator and bidder can view bids"
  ON bids FOR SELECT
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rfp_requests
      WHERE rfp_requests.id = bids.rfp_id
      AND rfp_requests.created_by = auth.uid()
    )
  );

CREATE POLICY "Developers can create bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'developer'
    )
  );

CREATE POLICY "Bidder can update their bids"
  ON bids FOR UPDATE
  TO authenticated
  USING (developer_id = auth.uid())
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Bidder can delete their bids"
  ON bids FOR DELETE
  TO authenticated
  USING (developer_id = auth.uid());

-- Vendor Ratings Table
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rated_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeline_rating integer CHECK (timeline_rating >= 1 AND timeline_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  support_rating integer CHECK (support_rating >= 1 AND support_rating <= 5),
  review_text text,
  would_recommend boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, rated_by, project_id)
);

ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vendor ratings"
  ON vendor_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Municipality users can create ratings"
  ON vendor_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'municipality'
    )
  );

CREATE POLICY "Rater can update their ratings"
  ON vendor_ratings FOR UPDATE
  TO authenticated
  USING (rated_by = auth.uid())
  WITH CHECK (rated_by = auth.uid());

CREATE POLICY "Rater can delete their ratings"
  ON vendor_ratings FOR DELETE
  TO authenticated
  USING (rated_by = auth.uid());

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  template_content text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public contract templates"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create contract templates"
  ON contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can update their contract templates"
  ON contract_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can delete their contract templates"
  ON contract_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Service Marketplace Table
CREATE TABLE IF NOT EXISTS service_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_model text NOT NULL,
  price_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  categories text[] DEFAULT '{}',
  regions_served text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  portfolio jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON service_marketplace FOR SELECT
  TO authenticated
  USING (status = 'active' OR provider_id = auth.uid());

CREATE POLICY "Users can create service listings"
  ON service_marketplace FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Provider can update their services"
  ON service_marketplace FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Provider can delete their services"
  ON service_marketplace FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid());

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_rfp_requests_municipality ON rfp_requests(municipality_id);
CREATE INDEX IF NOT EXISTS idx_rfp_requests_status ON rfp_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfp_requests_deadline ON rfp_requests(deadline);
CREATE INDEX IF NOT EXISTS idx_rfp_requests_category ON rfp_requests(category);

CREATE INDEX IF NOT EXISTS idx_bids_rfp ON bids(rfp_id);
CREATE INDEX IF NOT EXISTS idx_bids_developer ON bids(developer_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

CREATE INDEX IF NOT EXISTS idx_vendor_ratings_vendor ON vendor_ratings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_project ON vendor_ratings(project_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_public ON contract_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_service_marketplace_provider ON service_marketplace(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_marketplace_type ON service_marketplace(service_type);
CREATE INDEX IF NOT EXISTS idx_service_marketplace_status ON service_marketplace(status);

-- Insert Sample Contract Templates
INSERT INTO contract_templates (title, description, category, template_content, variables, is_public) VALUES
('Standard Software License Agreement', 'Basic software licensing agreement for smart city solutions', 'software',
  'SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into as of {{date}} between {{municipality_name}} ("Licensee") and {{developer_name}} ("Licensor").

1. GRANT OF LICENSE
Licensor grants Licensee a {{license_type}} license to use the software product "{{solution_name}}" for the purpose of {{use_case}}.

2. LICENSE FEE
The total license fee is {{currency}} {{amount}}, payable according to the following schedule:
{{payment_schedule}}

3. TERM
This Agreement shall commence on {{start_date}} and continue for {{term_length}}.

4. SUPPORT AND MAINTENANCE
Licensor shall provide {{support_level}} support and maintenance services.

5. WARRANTY
Licensor warrants that the software will perform substantially in accordance with the documentation for {{warranty_period}}.

6. LIMITATION OF LIABILITY
In no event shall either party be liable for indirect, incidental, or consequential damages.

7. TERMINATION
Either party may terminate this Agreement upon {{notice_period}} written notice.

IN WITNESS WHEREOF, the parties have executed this Agreement.

{{municipality_signature}}          {{developer_signature}}
Licensee                           Licensor',
  '["date", "municipality_name", "developer_name", "license_type", "solution_name", "use_case", "currency", "amount", "payment_schedule", "start_date", "term_length", "support_level", "warranty_period", "notice_period", "municipality_signature", "developer_signature"]'::jsonb,
  true),

('Professional Services Agreement', 'Contract for consulting and implementation services', 'services',
  'PROFESSIONAL SERVICES AGREEMENT

This Professional Services Agreement ("Agreement") is made as of {{date}} between {{client_name}} ("Client") and {{provider_name}} ("Provider").

1. SERVICES
Provider agrees to perform the following services: {{services_description}}

2. DELIVERABLES
The following deliverables shall be provided:
{{deliverables_list}}

3. COMPENSATION
Client shall pay Provider {{currency}} {{total_amount}} for the services.
Payment terms: {{payment_terms}}

4. TIMELINE
Services shall commence on {{start_date}} and be completed by {{end_date}}.

5. PROJECT MANAGER
Provider designates {{project_manager}} as the primary point of contact.

6. INTELLECTUAL PROPERTY
All deliverables created under this Agreement shall be the property of {{ip_owner}}.

7. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

8. INDEMNIFICATION
Each party shall indemnify the other against claims arising from their negligence or willful misconduct.

AGREED AND ACCEPTED:

{{client_signature}}               {{provider_signature}}
Client                            Provider',
  '["date", "client_name", "provider_name", "services_description", "deliverables_list", "currency", "total_amount", "payment_terms", "start_date", "end_date", "project_manager", "ip_owner", "client_signature", "provider_signature"]'::jsonb,
  true),

('Hardware Procurement Agreement', 'Agreement for purchasing hardware equipment', 'hardware',
  'HARDWARE PROCUREMENT AGREEMENT

This Agreement is entered into on {{date}} between {{buyer_name}} ("Buyer") and {{seller_name}} ("Seller").

1. EQUIPMENT
Seller agrees to sell and Buyer agrees to purchase the following equipment:
{{equipment_list}}

2. PURCHASE PRICE
The total purchase price is {{currency}} {{total_price}}.

3. DELIVERY
Delivery shall be made to {{delivery_address}} by {{delivery_date}}.
Shipping terms: {{shipping_terms}}

4. INSTALLATION
{{installation_clause}}

5. WARRANTY
Seller warrants that all equipment is free from defects for {{warranty_period}}.

6. MAINTENANCE
{{maintenance_terms}}

7. ACCEPTANCE TESTING
Buyer shall have {{testing_period}} to conduct acceptance testing.

8. PAYMENT TERMS
{{payment_schedule}}

AGREED:

{{buyer_signature}}                {{seller_signature}}
Buyer                             Seller',
  '["date", "buyer_name", "seller_name", "equipment_list", "currency", "total_price", "delivery_address", "delivery_date", "shipping_terms", "installation_clause", "warranty_period", "maintenance_terms", "testing_period", "payment_schedule", "buyer_signature", "seller_signature"]'::jsonb,
  true);
