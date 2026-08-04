-- =============================================================================
-- FinPilot AI Enterprise Platform — Complete Supabase PostgreSQL Schema
-- Compatible with Supabase SQL Editor and PostgreSQL 12+
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM ('SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM ('SYSTEM', 'APPLICATION', 'DOCUMENT', 'PAYMENT', 'REMINDER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Users Table (Identity & Security)
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

-- 4. Roles Table (RBAC Governance)
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

-- 5. User Roles Join Table
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

-- 6. User Sessions & Refresh Tokens
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

-- 7. Document Categories Table
CREATE TABLE IF NOT EXISTS public.document_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(36),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 8. Secure Document Vault Table
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);

-- 9. AI OCR Extractions Table
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

-- 10. Financial Applications Table
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

-- 11. Application Status History Table (Audit Timeline)
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    application_id VARCHAR(36) NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(36) NOT NULL REFERENCES public.users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Appointments & Consultations Table
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

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Audit Logs Table (Security Governance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(36),
    user_id VARCHAR(36) REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED INITIAL SYSTEM DATA (ROLES & DEMO USERS)
-- Password for all demo users is: Password123! (bcrypt hashed)
-- =============================================================================

-- Seed Roles
INSERT INTO public.roles (id, name, description) VALUES
  ('r-customer', 'Customer', 'Borrower portal access with vault and smart forms'),
  ('r-employee', 'Employee', 'Loan officer & ops analyst workspace'),
  ('r-manager', 'Manager', 'Executive underwriting & approval oversight'),
  ('r-admin', 'Admin', 'System administrator with full permissions')
ON CONFLICT (name) DO NOTHING;

-- Seed Document Categories
INSERT INTO public.document_categories (id, name, description) VALUES
  ('cat-identity', 'Identity Proof', 'PAN Card, Aadhaar, Passport, Voter ID'),
  ('cat-address', 'Address Proof', 'Electricity Bill, Rental Agreement, Utility Bill'),
  ('cat-income', 'Income Proof', 'Form 16, Salary Slip, Tax Return'),
  ('cat-banking', 'Banking Statements', 'Bank Statement Q1-Q4, Cancelled Cheque'),
  ('cat-property', 'Property Documents', 'Sale Deed, Property Tax Receipt')
ON CONFLICT (name) DO NOTHING;

-- Seed Demo Users
INSERT INTO public.users (id, first_name, last_name, email, password_hash, is_active) VALUES
  ('u-customer-1', 'Aarav', 'Mehta', 'aarav@finpilot.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE),
  ('u-employee-1', 'Priya', 'Verma', 'employee@finpilot.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE),
  ('u-manager-1', 'Daniel', 'Cole', 'manager@finpilot.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Assign User Roles
INSERT INTO public.user_roles (user_id, role_id) VALUES
  ('u-customer-1', 'r-customer'),
  ('u-employee-1', 'r-employee'),
  ('u-manager-1', 'r-manager')
ON CONFLICT (user_id, role_id) DO NOTHING;
