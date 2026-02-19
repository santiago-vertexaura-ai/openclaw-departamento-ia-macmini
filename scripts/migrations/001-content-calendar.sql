-- Migration 001: Content Calendar table
-- Run manually: psql $DATABASE_URL -f 001-content-calendar.sql
-- Or via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','linkedin','instagram')),
  suggested_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected','revision','published')),
  feedback TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  formula_ref TEXT,
  post_metrics JSONB DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'marina',
  task_id UUID,
  doc_id UUID,
  hook TEXT,
  hashtags TEXT[],
  visual_brief TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_status ON public.content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cc_time ON public.content_calendar(suggested_time);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
