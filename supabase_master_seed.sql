-- =============================================================================
-- FinPilot AI — Master Supabase Database Schema, Seed & Auth Sync Script
-- Project Reference: yyuwuvhjornynkzunirs
-- Connection Host: aws-0-ap-south-1.pooler.supabase.com
-- Database: postgres
-- =============================================================================

-- ─── 1. Enable Required PostgreSQL Extensions ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 2. Custom ENUM Types ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE application_status_enum AS ENUM (
    'SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status_enum AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'SYSTEM', 'APPLICATION', 'DOCUMENT', 'PAYMENT', 'REMINDER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 3. Public Schema Tables ─────────────────────────────────────────────────

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_image VARCHAR(500),
  last_login TIMESTAMPTZ,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- User Roles Join Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id VARCHAR(36) NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- User Sessions & Refresh Tokens
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  hashed_refresh_token VARCHAR(255) NOT NULL UNIQUE,
  device VARCHAR(255),
  browser VARCHAR(255),
  ip_address VARCHAR(45),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Document Categories Table
CREATE TABLE IF NOT EXISTS public.document_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Secure Document Vault Table
CREATE TABLE IF NOT EXISTS public.documents (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id VARCHAR(36) REFERENCES public.document_categories(id) ON DELETE SET NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  checksum VARCHAR(64),
  verification_status verification_status_enum NOT NULL DEFAULT 'PENDING',
  verified_by VARCHAR(36) REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason VARCHAR(500),
  health_score INT DEFAULT 95,
  version INT NOT NULL DEFAULT 1,
  is_favourite BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);

-- AI OCR Extractions Table
CREATE TABLE IF NOT EXISTS public.ocr_extractions (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  document_id VARCHAR(36) NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 98.50,
  extracted_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  cleaned_text TEXT,
  raw_ocr_output TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  tenant_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  application_type VARCHAR(100) NOT NULL,
  requested_amount NUMERIC(15,2) NOT NULL,
  sanctioned_amount NUMERIC(15,2),
  status application_status_enum NOT NULL DEFAULT 'SUBMITTED',
  risk_score INT DEFAULT 800,
  dti_ratio NUMERIC(5,2) DEFAULT 28.50,
  assigned_officer_id VARCHAR(36) REFERENCES public.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Application Status History Table
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  application_id VARCHAR(36) NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(36) NOT NULL REFERENCES public.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments & Consultations Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  officer_id VARCHAR(36) REFERENCES public.users(id),
  appointment_type VARCHAR(100) NOT NULL,
  meeting_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL DEFAULT 'SYSTEM',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(36) REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. Schema Evolution: Ensure Columns Exist for Pre-existing Tables ─────────
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 95;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description VARCHAR(255);

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 800;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS dti_ratio NUMERIC(5,2) DEFAULT 28.50;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_officer_id VARCHAR(36);

-- ─── 5. Seed Roles ──────────────────────────────────────────────────────────
INSERT INTO public.roles (id, name, description) VALUES
  ('r-customer', 'Customer', 'Borrower portal access with vault and smart forms'),
  ('r-employee', 'Employee', 'Loan officer and ops analyst workspace'),
  ('r-manager',  'Manager',  'Executive underwriting and approval oversight'),
  ('r-admin',    'Admin',    'System administrator with full permissions')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ─── 6. Seed Document Categories ────────────────────────────────────────────
INSERT INTO public.document_categories (id, name, description) VALUES
  ('cat-identity',  'Identity Proof',       'Aadhaar, PAN Card, Passport, Driving License, Voter ID'),
  ('cat-address',   'Address Proof',        'Electricity Bill, Rental Agreement, Gas Bill, Bank Passbook'),
  ('cat-income',    'Income Proof',         'Form-16, Salary Slip, IT Returns, Income Certificate'),
  ('cat-banking',   'Banking Statements',   'Bank Statement Q1-Q4, Cancelled Cheque, Net Banking PDF'),
  ('cat-property',  'Property Documents',   'Sale Deed, Property Tax Receipt, Title Deed, NOC'),
  ('cat-education', 'Education Documents',  'Degree Certificate, Mark Sheets, Bonafide Certificate'),
  ('cat-insurance', 'Insurance Policies',   'Health Insurance, Life Insurance, Vehicle Insurance'),
  ('cat-other',     'Other Documents',      'Any other supporting document for loan processing')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ─── 7. Seed Users (Default Password: Password123!) ─────────────────────────
INSERT INTO public.users (id, first_name, last_name, email, phone, password_hash, is_active, email_verified) VALUES
  ('u-bharani-1',  'Bharanidharan', 'Saravanakumar', 'bharani@finpilot.ai',   '+91-9342393957', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-employee-1', 'Priya',         'Verma',         'employee@finpilot.ai',  '+91-9876543210', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-manager-1',  'Rajesh',        'Kumar',         'manager@finpilot.ai',   '+91-9876501234', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-admin-1',    'Admin',         'FinPilot',      'admin@finpilot.ai',     '+91-9000000001', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-customer-2', 'Isha',          'Rao',           'isha.rao@gmail.com',    '+91-9123456789', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-customer-3', 'Kabir',         'Shah',          'kabir.shah@gmail.com',  '+91-9988776655', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, TRUE),
  ('u-customer-4', 'Meera',         'Nair',          'meera.nair@gmail.com',  '+91-9876512340', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE, FALSE),
  ('u-customer-5', 'Rohan',         'Gupta',         'rohan.gupta@gmail.com', '+91-9012345678', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', FALSE, TRUE)
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified;

-- ─── 8. Seed User Roles ─────────────────────────────────────────────────────
INSERT INTO public.user_roles (user_id, role_id) VALUES
  ('u-bharani-1',  'r-customer'),
  ('u-employee-1', 'r-employee'),
  ('u-manager-1',  'r-manager'),
  ('u-admin-1',    'r-admin'),
  ('u-customer-2', 'r-customer'),
  ('u-customer-3', 'r-customer'),
  ('u-customer-4', 'r-customer'),
  ('u-customer-5', 'r-customer')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ─── 9. Seed Documents ─────────────────────────────────────────────────────
INSERT INTO public.documents (
  id, user_id, category_id, original_name, storage_path, file_size, mime_type,
  verification_status, health_score, version, is_favourite, is_shared,
  expires_at, tags, created_at
) VALUES
  ('doc-aadhaar-1', 'u-bharani-1', 'cat-identity', 'Aadhaar Card.pdf',
   'vault/u-bharani-1/aadhaar-card.pdf', 1228800, 'application/pdf',
   'VERIFIED', 100, 2, TRUE, TRUE, NULL,
   ARRAY['KYC', 'Verified'], NOW() - INTERVAL '78 days'),

  ('doc-pan-1', 'u-bharani-1', 'cat-identity', 'PAN Card.pdf',
   'vault/u-bharani-1/pan-card.pdf', 491520, 'application/pdf',
   'VERIFIED', 100, 1, TRUE, FALSE, NULL,
   ARRAY['KYC'], NOW() - INTERVAL '78 days'),

  ('doc-dl-1', 'u-bharani-1', 'cat-identity', 'Driving License.pdf',
   'vault/u-bharani-1/driving-license.pdf', 839680, 'application/pdf',
   'VERIFIED', 72, 1, FALSE, FALSE, (NOW() + INTERVAL '20 days'),
   ARRAY['ID', 'Vehicle'], NOW() - INTERVAL '60 days'),

  ('doc-passport-1', 'u-bharani-1', 'cat-identity', 'Passport.pdf',
   'vault/u-bharani-1/passport.pdf', 2457600, 'application/pdf',
   'VERIFIED', 68, 1, FALSE, FALSE, (NOW() + INTERVAL '30 days'),
   ARRAY['Travel', 'ID'], NOW() - INTERVAL '90 days'),

  ('doc-elec-bill-1', 'u-bharani-1', 'cat-address', 'Electricity Bill - June 2026.pdf',
   'vault/u-bharani-1/electricity-bill-june.pdf', 317440, 'application/pdf',
   'VERIFIED', 100, 3, FALSE, FALSE, NULL,
   ARRAY['Address'], NOW() - INTERVAL '31 days'),

  ('doc-rental-1', 'u-bharani-1', 'cat-address', 'Rental Agreement.pdf',
   'vault/u-bharani-1/rental-agreement.pdf', 3170304, 'application/pdf',
   'VERIFIED', 100, 1, FALSE, FALSE, (NOW() + INTERVAL '180 days'),
   ARRAY['Address', 'Legal'], NOW() - INTERVAL '237 days'),

  ('doc-salary-jun-1', 'u-bharani-1', 'cat-income', 'Salary Slip - June 2026.pdf',
   'vault/u-bharani-1/salary-slip-jun-2026.pdf', 225280, 'application/pdf',
   'VERIFIED', 100, 6, TRUE, FALSE, NULL,
   ARRAY['Income'], NOW() - INTERVAL '30 days'),

  ('doc-form16-1', 'u-bharani-1', 'cat-income', 'Form-16 FY 2025-26.pdf',
   'vault/u-bharani-1/form16-fy25-26.pdf', 655360, 'application/pdf',
   'VERIFIED', 100, 1, FALSE, FALSE, NULL,
   ARRAY['Tax', 'Income'], NOW() - INTERVAL '44 days'),

  ('doc-inc-cert-1', 'u-bharani-1', 'cat-income', 'Income Certificate.pdf',
   'vault/u-bharani-1/income-certificate.pdf', 419840, 'application/pdf',
   'PENDING', 65, 1, FALSE, FALSE, (NOW() + INTERVAL '12 days'),
   ARRAY['Government'], NOW() - INTERVAL '325 days'),

  ('doc-bank-stmt-1', 'u-bharani-1', 'cat-banking', 'Bank Statement - Q4 2025.pdf',
   'vault/u-bharani-1/bank-stmt-q4-2025.pdf', 1843200, 'application/pdf',
   'REJECTED', 20, 2, FALSE, FALSE, NULL,
   ARRAY['Statement'], NOW() - INTERVAL '207 days'),

  ('doc-cheque-1', 'u-bharani-1', 'cat-banking', 'Cancelled Cheque.jpg',
   'vault/u-bharani-1/cancelled-cheque.jpg', 163840, 'image/jpeg',
   'VERIFIED', 100, 1, FALSE, FALSE, NULL,
   ARRAY['Banking'], NOW() - INTERVAL '78 days'),

  ('doc-prop-tax-1', 'u-bharani-1', 'cat-property', 'Property Tax Receipt.pdf',
   'vault/u-bharani-1/property-tax-receipt.pdf', 296960, 'application/pdf',
   'PENDING', 50, 1, FALSE, FALSE, (NOW() + INTERVAL '60 days'),
   ARRAY['Property'], NOW() - INTERVAL '96 days'),

  ('doc-degree-1', 'u-bharani-1', 'cat-education', 'Degree Certificate.pdf',
   'vault/u-bharani-1/degree-certificate.pdf', 1126400, 'application/pdf',
   'VERIFIED', 100, 1, FALSE, FALSE, NULL,
   ARRAY['Education'], NOW() - INTERVAL '330 days'),

  ('doc-health-ins-1', 'u-bharani-1', 'cat-insurance', 'Health Insurance Policy.pdf',
   'vault/u-bharani-1/health-insurance.pdf', 2048000, 'application/pdf',
   'VERIFIED', 68, 2, FALSE, FALSE, (NOW() + INTERVAL '7 days'),
   ARRAY['Insurance'], NOW() - INTERVAL '232 days')
ON CONFLICT (id) DO UPDATE SET
  original_name = EXCLUDED.original_name,
  verification_status = EXCLUDED.verification_status,
  health_score = EXCLUDED.health_score;

-- ─── 10. Seed OCR Extractions ─────────────────────────────────────────────────
INSERT INTO public.ocr_extractions (id, document_id, document_type, confidence_score, extracted_fields, processed_at)
VALUES
  ('ocr-aadhaar-1', 'doc-aadhaar-1', 'Aadhaar Card (UIDAI)', 99.40,
   '[{"label":"Name","value":"Bharanidharan Saravanakumar"},{"label":"Aadhaar No.","value":"XXXX XXXX 5549"},{"label":"Date of Birth","value":"01 Jul 2007"},{"label":"Gender","value":"Male"},{"label":"Address","value":"12/4 Nehru Street, Krishnagiri, Tamil Nadu - 635 001"}]'::jsonb,
   NOW() - INTERVAL '78 days'),

  ('ocr-pan-1', 'doc-pan-1', 'PAN Card (Income Tax)', 99.10,
   '[{"label":"PAN Number","value":"BHARN1234K"},{"label":"Name","value":"Bharanidharan Saravanakumar"},{"label":"Date of Birth","value":"01 Jul 2007"},{"label":"Father Name","value":"Saravanakumar"}]'::jsonb,
   NOW() - INTERVAL '78 days'),

  ('ocr-dl-1', 'doc-dl-1', 'Driving License (MORTH)', 97.80,
   '[{"label":"Name","value":"Bharanidharan Saravanakumar"},{"label":"License Number","value":"TN36W20250002527"},{"label":"Date of Birth","value":"01-07-2007"},{"label":"Date of Issue","value":"19-08-2025"},{"label":"Date of Expiry","value":"18-08-2045"},{"label":"Vehicle Class","value":"MCWG (Motorcycle with Gear)"},{"label":"Blood Group","value":"O+"},{"label":"Address","value":"12/4 Nehru Street, Krishnagiri, Tamil Nadu - 635 001"},{"label":"Issuing Authority","value":"RTO Krishnagiri (TN36)"}]'::jsonb,
   NOW() - INTERVAL '60 days'),

  ('ocr-salary-1', 'doc-salary-jun-1', 'Salary Slip', 98.60,
   '[{"label":"Employee Name","value":"Bharanidharan Saravanakumar"},{"label":"Employee ID","value":"EMP-20231047"},{"label":"Month","value":"June 2026"},{"label":"Employer","value":"Northwind Systems Pvt. Ltd."},{"label":"Gross Salary","value":"Rs.2,10,000"},{"label":"Deductions","value":"Rs.25,500"},{"label":"Net Pay","value":"Rs.1,84,500"},{"label":"PAN","value":"BHARN1234K"}]'::jsonb,
   NOW() - INTERVAL '30 days'),

  ('ocr-form16-1', 'doc-form16-1', 'Form-16 (Income Tax)', 99.20,
   '[{"label":"Employee Name","value":"Bharanidharan Saravanakumar"},{"label":"Employer","value":"Northwind Systems Pvt. Ltd."},{"label":"PAN","value":"BHARN1234K"},{"label":"Financial Year","value":"2025-26"},{"label":"Gross Income","value":"Rs.24,00,000"},{"label":"Tax Deducted","value":"Rs.2,80,000"},{"label":"Net Taxable Income","value":"Rs.21,20,000"}]'::jsonb,
   NOW() - INTERVAL '44 days')
ON CONFLICT (id) DO NOTHING;

-- ─── 11. Seed Financial Applications ─────────────────────────────────────────
INSERT INTO public.applications (
  id, user_id, application_number, application_type, requested_amount,
  sanctioned_amount, status, risk_score, dti_ratio, assigned_officer_id, remarks, created_at
) VALUES
  ('app-001', 'u-bharani-1', 'APP-24817', 'Home Loan',           6800000,  NULL,    'UNDER_REVIEW',     812, 28.5, 'u-employee-1', 'Documents verified. Moving to underwriting.', NOW() - INTERVAL '7 days'),
  ('app-002', 'u-customer-2','APP-24816', 'Business Loan',       2250000,  NULL,    'DOCUMENT_PENDING', 704, 32.1, 'u-employee-1', 'Waiting for GST returns.',                    NOW() - INTERVAL '8 days'),
  ('app-003', 'u-customer-3','APP-24812', 'Auto Loan',           1420000,  NULL,    'UNDER_REVIEW',     788, 22.4, 'u-employee-1', 'AI verification complete. Risk: Low.',        NOW() - INTERVAL '12 days'),
  ('app-004', 'u-customer-4','APP-24809', 'Personal Loan',        600000,  NULL,    'SUBMITTED',        611, 41.2, NULL,           'High DTI. Awaiting manager approval.',        NOW() - INTERVAL '14 days'),
  ('app-005', 'u-customer-5','APP-24804', 'Working Capital Loan',11000000, NULL,    'REJECTED',         578, 52.6, 'u-manager-1',  'Risk score below threshold. Bureau flag.',    NOW() - INTERVAL '20 days'),
  ('app-006', 'u-customer-2','APP-24798', 'Home Loan',           4100000,  4100000, 'APPROVED',         834, 24.1, 'u-manager-1',  'Sanction letter issued.',                     NOW() - INTERVAL '30 days')
ON CONFLICT (application_number) DO UPDATE SET
  status = EXCLUDED.status,
  remarks = EXCLUDED.remarks;

-- ─── 12. Seed Application Status History ────────────────────────────────────
INSERT INTO public.application_status_history (application_id, status, changed_by, remarks, created_at) VALUES
  ('app-001', 'SUBMITTED',        'u-bharani-1',  'Application submitted online',             NOW() - INTERVAL '7 days'),
  ('app-001', 'UNDER_REVIEW',     'u-employee-1', 'AI verified. Moving to underwriting.',    NOW() - INTERVAL '6 days 18 hours'),
  ('app-002', 'SUBMITTED',        'u-customer-2', 'Application submitted',                   NOW() - INTERVAL '8 days'),
  ('app-002', 'DOCUMENT_PENDING', 'u-employee-1', 'GST returns missing',                     NOW() - INTERVAL '7 days 12 hours'),
  ('app-003', 'SUBMITTED',        'u-customer-3', 'Application submitted',                   NOW() - INTERVAL '12 days'),
  ('app-003', 'UNDER_REVIEW',     'u-employee-1', 'Auto verification passed',                NOW() - INTERVAL '11 days'),
  ('app-004', 'SUBMITTED',        'u-customer-4', 'Application submitted',                   NOW() - INTERVAL '14 days'),
  ('app-005', 'SUBMITTED',        'u-customer-5', 'Application submitted',                   NOW() - INTERVAL '20 days'),
  ('app-005', 'REJECTED',         'u-manager-1',  'Credit score insufficient, bureau flag',  NOW() - INTERVAL '18 days'),
  ('app-006', 'APPROVED',         'u-manager-1',  'Sanction letter dispatched.',             NOW() - INTERVAL '27 days');

-- ─── 13. Seed Notifications ──────────────────────────────────────────────────
INSERT INTO public.notifications (id, user_id, type, title, message, is_read, created_at) VALUES
  ('notif-01', 'u-bharani-1', 'DOCUMENT',    'Driving License expires in 20 days',       'Your Driving License (TN36W20250002527) will expire soon. Upload a renewed copy to prevent loan delays.', FALSE, NOW() - INTERVAL '2 minutes'),
  ('notif-02', 'u-bharani-1', 'APPLICATION', 'APP-24817 moved to Underwriting',          'Your Rs.68L Home Loan application has passed AI KYC. Risk score: 812. ETA: 4 hours.', FALSE, NOW() - INTERVAL '18 minutes'),
  ('notif-03', 'u-bharani-1', 'SYSTEM',      'Consent requested: Bank Statement',        'Priya Verma has requested consent to access your Q4 2025 Bank Statement for APP-24817.', FALSE, NOW() - INTERVAL '1 hour'),
  ('notif-04', 'u-bharani-1', 'DOCUMENT',    'Form-16 OCR extraction verified',          'Vault AI extracted 7 fields from Form-16 FY 2025-26 with 99.2% confidence. Net taxable income: Rs.21,20,000.', TRUE, NOW() - INTERVAL '1 day'),
  ('notif-05', 'u-bharani-1', 'DOCUMENT',    'Health Insurance expires in 7 days',       'Your Star Health Insurance policy expires soon. Renew to maintain KYC compliance.', FALSE, NOW() - INTERVAL '3 hours'),
  ('notif-06', 'u-bharani-1', 'APPLICATION', 'Bank Statement flagged as too old',        'Bank Statement Q4 2025 is older than 6 months and was flagged by the risk engine. Upload a recent statement.', TRUE, NOW() - INTERVAL '2 days'),
  ('notif-07', 'u-bharani-1', 'SYSTEM',      'Login from new device detected',           'A login was detected from Chrome on Windows. If this was not you, change your password immediately.', TRUE, NOW() - INTERVAL '3 days'),
  ('notif-08', 'u-bharani-1', 'DOCUMENT',    'Aadhaar Card verification complete',       'Your Aadhaar Card has been verified by the KYC team. Vault is now 100% KYC compliant.', TRUE, NOW() - INTERVAL '5 days'),
  ('notif-e01','u-employee-1','APPLICATION', 'New application: APP-24817',               'Bharanidharan has submitted a Home Loan for Rs.68,00,000. Assigned to you for document review.', FALSE, NOW() - INTERVAL '7 days'),
  ('notif-e02','u-employee-1','APPLICATION', 'SLA breach warning: APP-24809',            'APP-24809 (Meera Nair - Personal Loan) is approaching SLA breach in 1 hour.', FALSE, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO UPDATE SET is_read = EXCLUDED.is_read;

-- ─── 14. Seed Audit Logs ─────────────────────────────────────────────────────
INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, ip_address, metadata, created_at) VALUES
  ('u-bharani-1',  'DOCUMENT_UPLOADED',   'document',    'doc-aadhaar-1',  '192.168.1.100', '{"filename":"Aadhaar Card.pdf"}'::jsonb,                             NOW() - INTERVAL '78 days'),
  ('u-bharani-1',  'DOCUMENT_UPLOADED',   'document',    'doc-pan-1',      '192.168.1.100', '{"filename":"PAN Card.pdf"}'::jsonb,                                NOW() - INTERVAL '78 days'),
  ('u-employee-1', 'DOCUMENT_VERIFIED',   'document',    'doc-aadhaar-1',  '10.0.0.50',     '{"verification_status":"VERIFIED"}'::jsonb,                         NOW() - INTERVAL '77 days'),
  ('u-bharani-1',  'APPLICATION_CREATED', 'application', 'app-001',        '192.168.1.100', '{"application_type":"Home Loan","amount":6800000}'::jsonb,           NOW() - INTERVAL '7 days'),
  ('u-employee-1', 'STATUS_CHANGED',      'application', 'app-001',        '10.0.0.50',     '{"from":"SUBMITTED","to":"UNDER_REVIEW"}'::jsonb,                   NOW() - INTERVAL '6 days'),
  ('u-bharani-1',  'VAULT_ACCESSED',      'document',    'doc-salary-jun-1','192.168.1.100','{"action":"view"}'::jsonb,                                          NOW() - INTERVAL '2 hours');

-- ─── 15. Sync Auth Users with Supabase Auth (auth.users & auth.identities) ────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      role, aud, confirmation_token
    )
    SELECT
      u.id::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      u.email,
      u.password_hash,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name, 'phone', u.phone),
      u.created_at,
      u.updated_at,
      'authenticated',
      'authenticated',
      ''
    FROM public.users u
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      updated_at = EXCLUDED.updated_at;

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    SELECT
      u.id,
      u.id::uuid,
      jsonb_build_object('sub', u.id, 'email', u.email),
      'email',
      NOW(),
      u.created_at,
      u.updated_at
    FROM public.users u
    ON CONFLICT (provider, id) DO NOTHING;

    RAISE NOTICE 'Supabase Auth Users & Identities synced successfully!';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Supabase Auth sync note: %', SQLERRM;
END $$;

-- =============================================================================
-- FINPILOT AI MASTER SCHEMA & SEED COMPLETED SUCCESSFULLY
-- =============================================================================
