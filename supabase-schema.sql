-- ==============================================================================
-- BHAROSA OS — SUPABASE RELATIONAL & DOCUMENT HYBRID SCHEMA
-- Run this script in the Supabase Dashboard SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('freelancer', 'client', 'admin')),
  title TEXT,
  organization TEXT,
  avatar TEXT,
  demo_login BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_org TEXT,
  freelancer_id TEXT NOT NULL,
  freelancer_name TEXT NOT NULL,
  total_budget NUMERIC DEFAULT 0,
  spent_budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  freelancer_private_notes TEXT,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_org TEXT,
  client_id TEXT,
  total_budget NUMERIC DEFAULT 0,
  timeline TEXT,
  category TEXT,
  description TEXT,
  milestones_count INT DEFAULT 1,
  milestones_preview JSONB DEFAULT '[]'::jsonb,
  protection TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  milestone_id TEXT,
  milestone_title TEXT,
  client_id TEXT NOT NULL,
  client_name TEXT,
  freelancer_id TEXT NOT NULL,
  freelancer_name TEXT,
  base_amount NUMERIC DEFAULT 0,
  gst_rate NUMERIC DEFAULT 0.18,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  tax_type TEXT DEFAULT 'standard_gst',
  status TEXT DEFAULT 'issued',
  issued_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  simulated_payment_provider TEXT
);

-- 5. SCOPE AMENDMENTS TABLE
CREATE TABLE IF NOT EXISTS public.scope_amendments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  additional_cost NUMERIC DEFAULT 0,
  additional_days INT DEFAULT 0,
  status TEXT DEFAULT 'pending_client_approval',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  project_id TEXT,
  milestone_id TEXT,
  action TEXT NOT NULL,
  reason TEXT,
  evidence_hash TEXT,
  details TEXT
);

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  milestone_id TEXT,
  project_title TEXT,
  milestone_title TEXT,
  raised_by TEXT NOT NULL,
  raised_by_name TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  resolution JSONB
);

-- 9. REFUNDS TABLE
CREATE TABLE IF NOT EXISTS public.refunds (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  status TEXT DEFAULT 'completed'
);

-- ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES FOR REST API ACCESS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated access via Anon Key for Bharosa client & server API
DO $$
BEGIN
  CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
  CREATE POLICY "Allow public write users" ON public.users FOR ALL USING (true);

  CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);
  CREATE POLICY "Allow public write projects" ON public.projects FOR ALL USING (true);

  CREATE POLICY "Allow public read opportunities" ON public.opportunities FOR SELECT USING (true);
  CREATE POLICY "Allow public write opportunities" ON public.opportunities FOR ALL USING (true);

  CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
  CREATE POLICY "Allow public write invoices" ON public.invoices FOR ALL USING (true);

  CREATE POLICY "Allow public read scope_amendments" ON public.scope_amendments FOR SELECT USING (true);
  CREATE POLICY "Allow public write scope_amendments" ON public.scope_amendments FOR ALL USING (true);

  CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
  CREATE POLICY "Allow public write audit_logs" ON public.audit_logs FOR ALL USING (true);

  CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
  CREATE POLICY "Allow public write messages" ON public.messages FOR ALL USING (true);

  CREATE POLICY "Allow public read disputes" ON public.disputes FOR SELECT USING (true);
  CREATE POLICY "Allow public write disputes" ON public.disputes FOR ALL USING (true);

  CREATE POLICY "Allow public read refunds" ON public.refunds FOR SELECT USING (true);
  CREATE POLICY "Allow public write refunds" ON public.refunds FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN
  -- Policies already created
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. Users
INSERT INTO public.users (id, name, email, role, title, organization, avatar, demo_login)
VALUES
  ('USR-101', 'Priya Sharma', 'priya@bharosa.design', 'freelancer', 'Senior Product Designer', NULL, 'PS', true),
  ('USR-102', 'Rahul Verma', 'rahul@growthnest.media', 'client', 'Head of Product, GrowthNest Media', 'GrowthNest Media', 'RV', true),
  ('USR-ADMIN', 'Platform Moderator', 'admin@bharosa.design', 'admin', 'Bharosa Super Admin', NULL, 'AD', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 2. Projects & Milestones
INSERT INTO public.projects (id, title, description, client_id, client_name, client_org, freelancer_id, freelancer_name, total_budget, spent_budget, status, start_date, freelancer_private_notes, milestones)
VALUES
  (
    'PRJ-101',
    'Fintech Mobile App Redesign',
    'Complete UI/UX overhaul of mobile banking app with biometric onboarding flow.',
    'USR-102',
    'Rahul Verma',
    'GrowthNest Media',
    'USR-101',
    'Priya Sharma',
    65000,
    25000,
    'active',
    '2026-10-01',
    'Client prefers Figma prototype links over raw MP4s. High attention to detail on KYC.',
    '[
      {
        "id": "MS-101",
        "title": "Milestone 1: Wireframes & Architecture Map",
        "amount": 25000,
        "status": "Invoiced",
        "deadline": "2026-10-14T18:00:00Z",
        "completedAt": "2026-10-14T17:45:00Z",
        "deliverables": [
          { "name": "Wireframes_v2.fig", "hash": "8f9b4c2e1a341b5d", "size": "14.2 MB", "submittedAt": "2026-10-12T11:30:00Z" },
          { "name": "IA_Flow_Map.pdf", "hash": "4e1cb892a091d33f", "size": "2.1 MB", "submittedAt": "2026-10-12T11:30:00Z" }
        ],
        "revisionsAllowed": 2,
        "revisionsUsed": 0,
        "invoiceId": "INV-2026-001"
      },
      {
        "id": "MS-102",
        "title": "Milestone 2: Design System & Interactive Prototypes",
        "amount": 20000,
        "status": "In review",
        "deadline": "2026-10-24T18:00:00Z",
        "completedAt": null,
        "deliverables": [
          { "name": "Design_System_Tokens.json", "hash": "d22a901e67bf3c88", "size": "1.4 MB", "submittedAt": "2026-10-16T11:30:00Z" },
          { "name": "Interactive_Prototype.fig", "hash": "b11f7c3a99e034ab", "size": "38.5 MB", "submittedAt": "2026-10-16T11:30:00Z" }
        ],
        "revisionsAllowed": 2,
        "revisionsUsed": 1,
        "silenceTriggered": false,
        "silenceWindowHours": 72,
        "lastActivityAt": "2026-10-16T11:30:00Z",
        "possibleScopeChange": null
      },
      {
        "id": "MS-103",
        "title": "Milestone 3: Developer Handoff Tokens & Asset Export",
        "amount": 20000,
        "status": "Agreed",
        "deadline": "2026-11-05T18:00:00Z",
        "completedAt": null,
        "deliverables": [],
        "revisionsAllowed": 2,
        "revisionsUsed": 0
      }
    ]'::jsonb
  ),
  (
    'PRJ-102',
    'E-commerce Marketplace Branding',
    'Brand identity, typography guidelines, and social asset kit.',
    'USR-102',
    'Rahul Verma',
    'GrowthNest Media',
    'USR-101',
    'Priya Sharma',
    45000,
    0,
    'active',
    '2026-10-10',
    'Client wants vibrant color accents and minimalist iconography.',
    '[
      {
        "id": "MS-201",
        "title": "Milestone 1: Identity Guide & Logos",
        "amount": 20000,
        "status": "In progress",
        "deadline": "2026-11-02T18:00:00Z",
        "completedAt": null,
        "deliverables": [],
        "revisionsAllowed": 2,
        "revisionsUsed": 0
      },
      {
        "id": "MS-202",
        "title": "Milestone 2: Social Media Marketing Templates",
        "amount": 25000,
        "status": "Draft",
        "deadline": "2026-11-20T18:00:00Z",
        "completedAt": null,
        "deliverables": [],
        "revisionsAllowed": 2,
        "revisionsUsed": 0
      }
    ]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Invoices
INSERT INTO public.invoices (id, project_id, milestone_id, milestone_title, client_id, client_name, freelancer_id, freelancer_name, base_amount, gst_rate, gst_amount, total_amount, tax_type, status, issued_at, simulated_payment_provider)
VALUES
  (
    'INV-2026-001',
    'PRJ-101',
    'MS-101',
    'Milestone 1: Wireframes & Architecture Map',
    'USR-102',
    'Rahul Verma',
    'USR-101',
    'Priya Sharma',
    25000,
    0.18,
    4500,
    29500,
    'standard_gst',
    'paid',
    '2026-10-14T17:45:00Z',
    'Razorpay Sandbox (Simulated)'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Scope Amendments
INSERT INTO public.scope_amendments (id, project_id, milestone_id, requested_by, requester_name, title, description, additional_cost, additional_days, status, created_at)
VALUES
  (
    'AMD-101',
    'PRJ-101',
    'MS-102',
    'USR-101',
    'Priya Sharma',
    '3D Spline Interactive Coin Animation',
    'Out-of-scope request for interactive 3D WebGL asset. Original SOW specifies 2D vector UI.',
    6500,
    2,
    'pending_client_approval',
    '2026-10-16T14:20:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Audit Logs
INSERT INTO public.audit_logs (id, timestamp, actor_id, actor_name, actor_role, project_id, milestone_id, action, reason, evidence_hash)
VALUES
  (
    'AUD-001',
    '2026-10-14T17:45:00Z',
    'USR-102',
    'Rahul Verma',
    'client',
    'PRJ-101',
    'MS-101',
    'MILESTONE_APPROVED',
    'All wireframe deliverables match agreed SOW specifications.',
    '4e1cb892a091d33f'
  ),
  (
    'AUD-002',
    '2026-10-16T11:30:00Z',
    'USR-101',
    'Priya Sharma',
    'freelancer',
    'PRJ-101',
    'MS-102',
    'DELIVERABLES_SUBMITTED',
    'Delivered design system components and interactive flow.',
    'd22a901e67bf3c88'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Opportunities
INSERT INTO public.opportunities (id, title, client_name, client_org, client_id, total_budget, timeline, category, description, milestones_count, milestones_preview, protection, status)
VALUES
  (
    'OPP-101',
    'SaaS Billing Dashboard & Analytics Portal',
    'Rahul Verma',
    'GrowthNest Media',
    'USR-102',
    85000,
    '14 Days',
    'Product Design & Frontend Tokens',
    'Complete redesign of enterprise subscription management, invoice breakdown views, and responsive charts.',
    3,
    '[{"title": "Information Architecture & Wireframes", "amount": 30000}, {"title": "Interactive Prototype & Component Library", "amount": 30000}, {"title": "Production Token Export & QA Handoff", "amount": 25000}]'::jsonb,
    'Payment via provider (simulated in demo) • File hashes recorded for integrity',
    'open'
  ),
  (
    'OPP-102',
    'Mobile Wallet Biometric Checkout Flow',
    'Ananya Deshmukh',
    'PayZen Global',
    'USR-103',
    60000,
    '10 Days',
    'Fintech Mobile UX',
    'Native iOS & Android payment authorization screens with biometric confirmation and fallback PIN authentication.',
    2,
    '[{"title": "User Flow Diagrams & Low-Fi Prototyping", "amount": 25000}, {"title": "High-Fi Interactive Prototypes with Micro-interactions", "amount": 35000}]'::jsonb,
    'Payment via provider (simulated in demo) • Revision Quota: 2 Rounds',
    'open'
  ),
  (
    'OPP-103',
    'D2C Brand Identity & Packaging Guidelines',
    'Karan Mehra',
    'Artisan Botanics',
    'USR-104',
    45000,
    '7 Days',
    'Brand Strategy & Visual Assets',
    'Minimalist sustainable packaging layout, typography scale, logo vector assets, and social template library.',
    2,
    '[{"title": "Brand Guidelines & Logo Variations", "amount": 20000}, {"title": "Packaging Dielines & Social Kit", "amount": 25000}]'::jsonb,
    'Payment via provider (simulated in demo) • SOW Protected',
    'open'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Messages
INSERT INTO public.messages (id, project_id, sender_id, sender_name, sender_role, text, timestamp)
VALUES
  (
    'MSG-001',
    'PRJ-101',
    'USR-102',
    'Rahul Verma',
    'client',
    'Hi Priya, reviewed Milestone 1 wireframes — architecture looks solid. Looking forward to the interactive prototype on Milestone 2.',
    '2026-10-15T10:15:00Z'
  ),
  (
    'MSG-002',
    'PRJ-101',
    'USR-101',
    'Priya Sharma',
    'freelancer',
    'Thanks Rahul! The interactive prototype has been uploaded to Milestone 2 with cryptographic SHA-256 integrity hashes.',
    '2026-10-16T11:35:00Z'
  )
ON CONFLICT (id) DO NOTHING;
