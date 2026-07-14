-- Migration: v1.2 — SECURITY DEFINER functions for soft-delete operations
-- These functions bypass RLS so deletion works even if the session expires.
-- The USING clause on SELECT policies already filters out soft-deleted rows,
-- so these functions only set the deleted_at timestamp (no data loss).

-- Projects: soft-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION soft_delete_project(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.projects SET deleted_at = now() WHERE id = project_id;
END;
$$;

-- Goals: soft-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION soft_delete_goal(goal_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.goals SET deleted_at = now() WHERE id = goal_id;
END;
$$;

-- Project tasks: hard-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION hard_delete_project_task(task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.project_tasks WHERE id = task_id;
END;
$$;

-- Goal tasks: hard-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION hard_delete_goal_task(task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.goal_tasks WHERE id = task_id;
END;
$$;

-- Project risks: hard-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION hard_delete_project_risk(risk_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.project_risks WHERE id = risk_id;
END;
$$;

-- Goal indicators: hard-delete via SECURITY DEFINER
CREATE OR REPLACE FUNCTION hard_delete_goal_indicator(indicator_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.goal_indicators WHERE id = indicator_id;
END;
$$;
