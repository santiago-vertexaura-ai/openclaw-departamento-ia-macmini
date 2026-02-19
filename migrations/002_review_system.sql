-- Migration 002: Review System for agent_docs
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xacthbehposxdrfqajwz/sql/new
-- Date: 2026-02-16

-- 1. Add review_status column
ALTER TABLE public.agent_docs
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending_review';

-- 2. Add review_feedback column (for Santi's feedback text)
ALTER TABLE public.agent_docs
  ADD COLUMN IF NOT EXISTS review_feedback text;

-- 3. Add CHECK constraint for review_status valid values
DO $$ BEGIN
  ALTER TABLE public.agent_docs
    ADD CONSTRAINT agent_docs_review_status_check
    CHECK (review_status IN ('pending_review', 'approved', 'revision_requested', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Set existing non-draft docs to 'approved' (they don't need review)
UPDATE public.agent_docs
  SET review_status = 'approved'
  WHERE doc_type != 'draft'
  AND (review_status IS NULL OR review_status = 'pending_review');

-- 5. Ensure draft docs are 'pending_review'
UPDATE public.agent_docs
  SET review_status = 'pending_review'
  WHERE doc_type = 'draft'
  AND (review_status IS NULL);

-- 6. Rating column (if not already present from previous migration)
-- Note: rating already exists as float on this project
-- ALTER TABLE public.agent_docs ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'agent_docs'
AND column_name IN ('review_status', 'rating', 'review_feedback', 'comments')
ORDER BY column_name;
