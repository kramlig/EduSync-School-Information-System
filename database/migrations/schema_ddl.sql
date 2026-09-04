-- Auto-generated DDL from OpenAPI schema
-- Generated: 2026-03-31T13:42:49.575Z

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."ancillary_responsibilities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "responsibility" TEXT NOT NULL,
  "description" TEXT,
  "hours_per_week" NUMERIC,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."announcements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "date" DATE DEFAULT CURRENT_DATE NOT NULL,
  "target" TEXT DEFAULT 'all' NOT NULL,
  "author_id" TEXT,
  "author_name" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "learning_area_id" UUID NOT NULL,
  "teacher_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "due_date" TIMESTAMPTZ,
  "max_score" NUMERIC,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."attendance_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "status" TEXT DEFAULT 'Present' NOT NULL,
  "remarks" TEXT,
  "recorded_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID,
  "user_id" UUID,
  "table_name" TEXT NOT NULL,
  "record_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "old_data" JSONB,
  "new_data" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."billing_statements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "ledger_id" UUID,
  "statement_date" DATE NOT NULL,
  "school_year" TEXT NOT NULL,
  "previous_balance" NUMERIC DEFAULT 0,
  "new_charges" NUMERIC DEFAULT 0,
  "payments_received" NUMERIC DEFAULT 0,
  "current_balance" NUMERIC DEFAULT 0,
  "line_items" JSONB,
  "due_date" DATE,
  "minimum_payment" NUMERIC,
  "status" TEXT DEFAULT 'sent',
  "sent_at" TIMESTAMPTZ,
  "viewed_at" TIMESTAMPTZ,
  "pdf_url" TEXT,
  "pdf_generated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."book_issuances" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "book_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "issue_date" DATE DEFAULT CURRENT_DATE NOT NULL,
  "due_date" DATE,
  "return_date" DATE,
  "status" TEXT DEFAULT 'issued',
  "condition_on_issue" TEXT DEFAULT 'Good',
  "condition_on_return" TEXT,
  "remarks" TEXT,
  "issued_by" UUID,
  "issued_by_name" TEXT,
  "returned_to" UUID,
  "returned_to_name" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."books" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT,
  "publisher" TEXT,
  "isbn" TEXT,
  "book_number" TEXT,
  "category" TEXT NOT NULL,
  "subject" TEXT,
  "grade_level" INTEGER,
  "total_copies" INTEGER DEFAULT 1 NOT NULL,
  "available_copies" INTEGER DEFAULT 1 NOT NULL,
  "condition" TEXT DEFAULT 'Good',
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "created_by" UUID,
  "created_by_name" TEXT,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."class_schedules" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "section_id" UUID,
  "learning_area_id" UUID,
  "teacher_id" UUID,
  "day_of_week" TEXT NOT NULL,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "room" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "title" TEXT,
  "type" TEXT DEFAULT 'academic',
  "scope" TEXT DEFAULT 'section',
  "end_day_of_week" TEXT,
  "grade_level" INTEGER
);

CREATE TABLE IF NOT EXISTS public."core_value_grades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "core_value_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "q1" TEXT,
  "q2" TEXT,
  "q3" TEXT,
  "q4" TEXT,
  "graded_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "indicator_ratings" JSONB
);

CREATE TABLE IF NOT EXISTS public."core_values" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "indicators" TEXT[]
);

CREATE TABLE IF NOT EXISTS public."districts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "division_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "psds_name" TEXT,
  "psds_contact" TEXT,
  "barangays" TEXT[],
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."division_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "division_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "user_name" TEXT NOT NULL,
  "user_email" TEXT,
  "user_role" TEXT,
  "action_type" TEXT NOT NULL,
  "action_category" TEXT NOT NULL,
  "action_description" TEXT NOT NULL,
  "resource_type" TEXT,
  "resource_id" UUID,
  "resource_name" TEXT,
  "school_id" UUID,
  "school_name" TEXT,
  "old_data" JSONB,
  "new_data" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "session_id" TEXT,
  "status" TEXT DEFAULT 'success',
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."division_users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "division_id" UUID NOT NULL,
  "user_id" UUID,
  "firebase_uid" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT DEFAULT 'division_supervisor' NOT NULL,
  "permissions" JSONB,
  "assigned_district_id" UUID,
  "assigned_district_ids" TEXT[],
  "accessible_school_ids" TEXT[],
  "contact_phone" TEXT,
  "position_title" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."divisions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "region_code" TEXT,
  "address" TEXT,
  "city" TEXT,
  "province" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "superintendent_name" TEXT,
  "asst_superintendent_name" TEXT,
  "settings" JSONB,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."ecr_activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "teacher_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "learning_area_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "quarter" TEXT NOT NULL,
  "activity_type" TEXT NOT NULL,
  "activity_number" INTEGER NOT NULL,
  "activity_name" TEXT,
  "description" TEXT,
  "max_score" NUMERIC NOT NULL,
  "activity_date" DATE,
  "due_date" DATE,
  "is_published" BOOLEAN DEFAULT false,
  "is_locked" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."ecr_component_grades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "learning_area_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "quarter" TEXT NOT NULL,
  "ww_total_score" NUMERIC DEFAULT 0,
  "ww_max_score" NUMERIC DEFAULT 0,
  "ww_percentage" NUMERIC DEFAULT 0,
  "ww_transmuted" NUMERIC DEFAULT 0,
  "pt_total_score" NUMERIC DEFAULT 0,
  "pt_max_score" NUMERIC DEFAULT 0,
  "pt_percentage" NUMERIC DEFAULT 0,
  "pt_transmuted" NUMERIC DEFAULT 0,
  "qa_total_score" NUMERIC DEFAULT 0,
  "qa_max_score" NUMERIC DEFAULT 0,
  "qa_percentage" NUMERIC DEFAULT 0,
  "qa_transmuted" NUMERIC DEFAULT 0,
  "ww_weighted" NUMERIC DEFAULT 0,
  "pt_weighted" NUMERIC DEFAULT 0,
  "qa_weighted" NUMERIC DEFAULT 0,
  "quarterly_grade" NUMERIC DEFAULT 0,
  "last_computed_at" TIMESTAMPTZ DEFAULT now(),
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ecr_scores" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "activity_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "raw_score" NUMERIC,
  "status" TEXT DEFAULT 'pending',
  "remarks" TEXT,
  "graded_by" UUID,
  "graded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ecr_weights" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "learning_area_id" UUID,
  "grade_level_min" INTEGER,
  "grade_level_max" INTEGER,
  "ww_weight" NUMERIC DEFAULT 30 NOT NULL,
  "pt_weight" NUMERIC DEFAULT 50 NOT NULL,
  "qa_weight" NUMERIC DEFAULT 20 NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."elln_assessments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "student_name" TEXT NOT NULL,
  "grade_level" INTEGER NOT NULL,
  "school_year" TEXT NOT NULL,
  "quarter" TEXT NOT NULL,
  "literacy_scores" JSONB NOT NULL,
  "numeracy_scores" JSONB NOT NULL,
  "literacy_score" NUMERIC NOT NULL,
  "numeracy_score" NUMERIC NOT NULL,
  "overall_score" NUMERIC NOT NULL,
  "proficiency_level" TEXT NOT NULL,
  "assessed_by" TEXT NOT NULL,
  "assessed_by_name" TEXT NOT NULL,
  "assessment_date" DATE NOT NULL,
  "notes" TEXT,
  "recommendations" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."enrollment_applications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_number" TEXT NOT NULL,
  "student_info" JSONB NOT NULL,
  "guardian1" JSONB NOT NULL,
  "guardian2" JSONB,
  "current_address" JSONB NOT NULL,
  "permanent_address" JSONB,
  "same_as_current" BOOLEAN DEFAULT true,
  "academic_info" JSONB NOT NULL,
  "health_info" JSONB,
  "documents" JSONB,
  "status" TEXT DEFAULT 'draft' NOT NULL,
  "submitted_at" TIMESTAMPTZ,
  "submitted_by" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "review_notes" TEXT,
  "rejection_reason" TEXT,
  "enrolled_student_id" UUID,
  "section_id" UUID,
  "enrollment_date" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."fee_structures" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "grade_level" INTEGER NOT NULL,
  "school_year" TEXT NOT NULL,
  "track" TEXT,
  "strand" TEXT,
  "tuition_amount" NUMERIC DEFAULT 0 NOT NULL,
  "registration_fee" NUMERIC DEFAULT 0,
  "id_fee" NUMERIC DEFAULT 0,
  "insurance_fee" NUMERIC DEFAULT 0,
  "misc_fees" JSONB,
  "lab_fees" JSONB,
  "full_payment_discount" NUMERIC DEFAULT 0,
  "quarterly_discount" NUMERIC DEFAULT 0,
  "monthly_discount" NUMERIC DEFAULT 0,
  "allow_installments" BOOLEAN DEFAULT true,
  "installment_plans" JSONB,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "created_by" UUID,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."grades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "learning_area_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "q1" NUMERIC,
  "q2" NUMERIC,
  "q3" NUMERIC,
  "q4" NUMERIC,
  "composite_grades" JSONB,
  "final_grade" NUMERIC,
  "remarks" TEXT,
  "graded_by" UUID,
  "graded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."homeroom_guidance_grades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "q1_ratings" JSONB NOT NULL,
  "q2_ratings" JSONB NOT NULL,
  "q3_ratings" JSONB NOT NULL,
  "q4_ratings" JSONB NOT NULL,
  "graded_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."learning_areas" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "grade_levels" INTEGER[] NOT NULL,
  "is_composite" BOOLEAN DEFAULT false,
  "components" TEXT[],
  "display_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "credits" INTEGER DEFAULT 3,
  "category" TEXT DEFAULT 'core',
  "department" TEXT,
  "k_to_twelve_code" TEXT,
  "semester_based" BOOLEAN DEFAULT false,
  "semester" INTEGER,
  "track_required" TEXT[],
  "prerequisite_id" UUID,
  "hours_per_week" INTEGER,
  "subject_group" TEXT
);

CREATE TABLE IF NOT EXISTS public."lesson_plans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "learning_area_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "objectives" TEXT[] NOT NULL,
  "activities" TEXT[] NOT NULL,
  "materials" TEXT[] NOT NULL,
  "assessment" TEXT[] NOT NULL,
  "resources" JSONB,
  "assignment_ids" TEXT[],
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."login_audit" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firebase_uid" TEXT,
  "email" TEXT NOT NULL,
  "user_type" TEXT,
  "school_id" UUID,
  "login_method" TEXT DEFAULT 'email_password',
  "login_status" TEXT NOT NULL,
  "login_type" TEXT NOT NULL,
  "ip_address" INET,
  "user_agent" TEXT,
  "device_fingerprint" TEXT,
  "geo_country" TEXT,
  "geo_city" TEXT,
  "error_code" TEXT,
  "error_message" TEXT,
  "attempt_count" INTEGER DEFAULT 1,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "login_date" DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public."monthly_enrollment_snapshots" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "grade_level" INTEGER NOT NULL,
  "section_id" UUID,
  "section_name" TEXT,
  "beginning_enrollment" INTEGER DEFAULT 0 NOT NULL,
  "transferred_in" INTEGER DEFAULT 0 NOT NULL,
  "transferred_out" INTEGER DEFAULT 0 NOT NULL,
  "dropped" INTEGER DEFAULT 0 NOT NULL,
  "ending_enrollment" INTEGER DEFAULT 0 NOT NULL,
  "total_school_days" INTEGER DEFAULT 0 NOT NULL,
  "total_absences" INTEGER DEFAULT 0 NOT NULL,
  "attendance_rate" NUMERIC DEFAULT 0,
  "snapshot_date" DATE NOT NULL,
  "created_by" UUID,
  "created_by_name" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."parent_students" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "relationship" TEXT,
  "is_primary_contact" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."parents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "user_id" UUID,
  "name" TEXT NOT NULL,
  "relationship" TEXT,
  "occupation" TEXT,
  "contact_number" TEXT,
  "email" TEXT,
  "address" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "firebase_uid" TEXT
);

CREATE TABLE IF NOT EXISTS public."payment_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "payment_provider" TEXT DEFAULT 'paymongo' NOT NULL,
  "payment_provider_id" TEXT,
  "checkout_session_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'PHP' NOT NULL,
  "status" TEXT DEFAULT 'paid' NOT NULL,
  "billing_cycle" TEXT,
  "description" TEXT,
  "payment_method_type" TEXT,
  "receipt_url" TEXT,
  "metadata" JSONB,
  "period_start" TIMESTAMPTZ,
  "period_end" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."payment_proofs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "ledger_id" UUID,
  "file_url" TEXT NOT NULL,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_size" INTEGER,
  "amount" NUMERIC NOT NULL,
  "payment_method" TEXT,
  "payment_date" DATE,
  "reference_number" TEXT,
  "status" TEXT DEFAULT 'pending',
  "verified_at" TIMESTAMPTZ,
  "verified_by" UUID,
  "rejection_reason" TEXT,
  "receipt_id" UUID,
  "uploaded_by" UUID,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."promotion_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "section_id" UUID,
  "school_year" TEXT NOT NULL,
  "grading_period" TEXT,
  "current_grade_level" INTEGER NOT NULL,
  "socio_emotional_dev" TEXT,
  "physical_motor_dev" TEXT,
  "cognitive_dev" TEXT,
  "language_literacy_dev" TEXT,
  "general_average" NUMERIC,
  "promotion_status" TEXT NOT NULL,
  "next_grade_level" INTEGER,
  "next_section_id" UUID,
  "remarks" TEXT,
  "attendance_days_present" INTEGER,
  "attendance_days_absent" INTEGER,
  "recorded_by" UUID,
  "approved_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."rate_limit_blocks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "block_type" TEXT NOT NULL,
  "block_value" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "attempt_count" INTEGER DEFAULT 0,
  "blocked_at" TIMESTAMPTZ DEFAULT now(),
  "blocked_until" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."receipts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "ledger_id" UUID,
  "receipt_number" TEXT NOT NULL,
  "receipt_date" DATE DEFAULT CURRENT_DATE NOT NULL,
  "amount" NUMERIC NOT NULL,
  "payment_method" TEXT NOT NULL,
  "check_number" TEXT,
  "bank_name" TEXT,
  "reference_number" TEXT,
  "description" TEXT,
  "notes" TEXT,
  "applied_to" JSONB,
  "recorded_by" UUID,
  "status" TEXT DEFAULT 'valid',
  "voided_at" TIMESTAMPTZ,
  "voided_by" UUID,
  "void_reason" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."referral_codes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."referral_credits_per_year" (
  "referrer_user_id" TEXT,
  "credit_year" NUMERIC,
  "credits_used" BIGINT
);

CREATE TABLE IF NOT EXISTS public."referrals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrer_user_id" TEXT NOT NULL,
  "referred_user_id" TEXT,
  "referred_email" TEXT,
  "referral_code" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "credited" BOOLEAN DEFAULT false NOT NULL,
  "credit_month_start" TIMESTAMPTZ,
  "credit_month_end" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."school_invitations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "invite_code" TEXT NOT NULL,
  "invited_email" TEXT,
  "invited_by" TEXT NOT NULL,
  "role" TEXT DEFAULT 'teacher' NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "accepted_by" TEXT,
  "accepted_at" TIMESTAMPTZ,
  "data_action" TEXT,
  "expires_at" TIMESTAMPTZ DEFAULT (now() + '30 days'::interval) NOT NULL,
  "max_uses" INTEGER DEFAULT 1 NOT NULL,
  "use_count" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."schools" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "school_id_number" TEXT,
  "division" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "address" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "principal_name" TEXT,
  "current_school_year" TEXT NOT NULL,
  "settings" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "district" TEXT,
  "tin" TEXT,
  "division_id" UUID,
  "district_id" UUID,
  "type" TEXT DEFAULT 'institutional' NOT NULL,
  "owner_uid" TEXT,
  "tier" TEXT DEFAULT 'school',
  "school_type" TEXT
);

CREATE TABLE IF NOT EXISTS public."sections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "grade_level" INTEGER NOT NULL,
  "school_year" TEXT NOT NULL,
  "adviser_id" UUID,
  "room_number" TEXT,
  "capacity" INTEGER,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."student_assignment_grades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "assignment_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "score" NUMERIC,
  "submission_date" TIMESTAMPTZ,
  "file_path" TEXT,
  "feedback" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."student_health_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "assessment_period" TEXT DEFAULT 'beginning' NOT NULL,
  "assessment_date" DATE NOT NULL,
  "height_cm" NUMERIC,
  "weight_kg" NUMERIC,
  "bmi" NUMERIC,
  "bmi_category" TEXT,
  "nutritional_status" TEXT,
  "vision_screening" TEXT,
  "hearing_screening" TEXT,
  "skin_screening" TEXT,
  "eyes_screening" TEXT,
  "oral_health_screening" TEXT,
  "menarche_status" TEXT,
  "menarche_age" INTEGER,
  "deworming_1st_dose" DATE,
  "deworming_2nd_dose" DATE,
  "deworming_status" TEXT,
  "immunization_complete" BOOLEAN DEFAULT false,
  "immunization_remarks" TEXT,
  "feeding_program_enrolled" BOOLEAN DEFAULT false,
  "feeding_program_type" TEXT,
  "has_disability" BOOLEAN DEFAULT false,
  "disability_type" TEXT[],
  "chronic_illness" TEXT[],
  "allergies" TEXT[],
  "remarks" TEXT,
  "assessed_by_id" UUID,
  "assessed_by_name" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."student_ledgers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "total_charges" NUMERIC DEFAULT 0 NOT NULL,
  "total_payments" NUMERIC DEFAULT 0 NOT NULL,
  "balance" NUMERIC DEFAULT 0 NOT NULL,
  "fee_structure_id" UUID,
  "charges" JSONB,
  "payments" JSONB,
  "payment_status" TEXT DEFAULT 'pending',
  "last_payment_date" TIMESTAMPTZ,
  "due_date" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."student_movements" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "student_name" TEXT NOT NULL,
  "lrn" TEXT,
  "grade_level" INTEGER NOT NULL,
  "section_id" UUID,
  "section_name" TEXT,
  "movement_type" TEXT NOT NULL,
  "movement_date" DATE NOT NULL,
  "school_year" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "previous_school" TEXT,
  "destination_school" TEXT,
  "reason" TEXT,
  "remarks" TEXT,
  "created_by" UUID,
  "created_by_name" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."students" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "user_id" UUID,
  "lrn" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "middle_name" TEXT,
  "last_name" TEXT NOT NULL,
  "suffix" TEXT,
  "gender" TEXT NOT NULL,
  "date_of_birth" DATE,
  "place_of_birth" TEXT,
  "section_id" UUID,
  "grade_level" INTEGER NOT NULL,
  "enrollment_status" TEXT DEFAULT 'enrolled',
  "address" TEXT,
  "contact_number" TEXT,
  "email" TEXT,
  "religion" TEXT,
  "indigenous_people" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "firebase_uid" TEXT,
  "photo_url" TEXT,
  "photo_path" TEXT,
  "photo_uploaded_at" TIMESTAMPTZ,
  "nationality" TEXT,
  "mother_tongue" TEXT,
  "barangay" TEXT,
  "city" TEXT,
  "province" TEXT,
  "zip_code" TEXT,
  "guardian_name" TEXT,
  "guardian_relationship" TEXT,
  "guardian_contact_number" TEXT,
  "guardian_email" TEXT,
  "guardian_occupation" TEXT,
  "guardian_address" TEXT,
  "enrollment_date" DATE,
  "previous_school" TEXT,
  "previous_school_address" TEXT,
  "year_last_attended" TEXT,
  "blood_type" TEXT,
  "health_notes" TEXT,
  "special_needs" TEXT,
  "remarks" TEXT,
  "four_ps_beneficiary" BOOLEAN DEFAULT false,
  "disabled_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "tier" TEXT DEFAULT 'free' NOT NULL,
  "status" TEXT DEFAULT 'active' NOT NULL,
  "max_students" INTEGER DEFAULT 50 NOT NULL,
  "max_teaching_sections" INTEGER DEFAULT 1 NOT NULL,
  "max_advisory_sections" INTEGER DEFAULT 1 NOT NULL,
  "max_downloads_per_day" INTEGER DEFAULT 10 NOT NULL,
  "payment_provider" TEXT,
  "payment_provider_customer_id" TEXT,
  "payment_provider_subscription_id" TEXT,
  "billing_cycle" TEXT,
  "amount_cents" INTEGER,
  "currency" TEXT DEFAULT 'PHP',
  "current_period_start" TIMESTAMPTZ,
  "current_period_end" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "ecr_enabled" BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public."substitute_assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "teacher_id" TEXT NOT NULL,
  "original_teacher_id" TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "reason" TEXT,
  "notes" TEXT,
  "status" TEXT DEFAULT 'pending',
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "created_by" TEXT
);

CREATE TABLE IF NOT EXISTS public."superadmins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firebase_uid" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."teachers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "user_id" UUID,
  "name" TEXT NOT NULL,
  "employee_number" TEXT,
  "specialization" TEXT,
  "department" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ,
  "email" TEXT,
  "contact_number" TEXT,
  "role" TEXT DEFAULT 'teacher',
  "assignments" JSONB,
  "firebase_uid" TEXT,
  "first_name" TEXT,
  "middle_name" TEXT,
  "last_name" TEXT,
  "position" TEXT,
  "employment_status" TEXT,
  "date_hired" DATE,
  "highest_education" TEXT,
  "major_specialization" TEXT,
  "prc_license_number" TEXT,
  "prc_license_expiry" DATE,
  "phone" TEXT,
  "disabled_at" TIMESTAMPTZ,
  "workspace_type" TEXT DEFAULT 'institutional' NOT NULL,
  "tier" TEXT DEFAULT 'school' NOT NULL
);

CREATE TABLE IF NOT EXISTS public."teaching_assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "school_year" TEXT NOT NULL,
  "grade_level" INTEGER NOT NULL,
  "section_id" UUID,
  "section_name" TEXT,
  "subject" TEXT NOT NULL,
  "hours_per_week" NUMERIC DEFAULT 0 NOT NULL,
  "is_advisory" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "learning_area_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "is_active" BOOLEAN DEFAULT true,
  "created_by" UUID,
  "updated_by" UUID,
  "start_date" DATE,
  "end_date" DATE,
  "notes" TEXT
);

CREATE TABLE IF NOT EXISTS public."textbook_distributions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "book_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "section_id" UUID,
  "school_year" TEXT NOT NULL,
  "distributed_date" DATE DEFAULT CURRENT_DATE NOT NULL,
  "expected_return_date" DATE,
  "actual_return_date" DATE,
  "condition_issued" TEXT DEFAULT 'good' NOT NULL,
  "condition_returned" TEXT,
  "distribution_status" TEXT DEFAULT 'issued' NOT NULL,
  "amount_charged" NUMERIC DEFAULT 0,
  "payment_status" TEXT DEFAULT 'none',
  "remarks" TEXT,
  "distributed_by" UUID,
  "received_by" UUID,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."usage_tracking" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "session_id" TEXT,
  "action" TEXT NOT NULL,
  "form_type" TEXT,
  "metadata" JSONB,
  "ip_hash" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "firebase_uid" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "avatar_url" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  "deleted_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public."workspace_migrations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invitation_id" UUID,
  "teacher_uid" TEXT NOT NULL,
  "source_school_id" UUID NOT NULL,
  "target_school_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "students_migrated" INTEGER DEFAULT 0,
  "grades_migrated" INTEGER DEFAULT 0,
  "error_message" TEXT,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

