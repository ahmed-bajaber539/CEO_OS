-- ============================================================
-- CEO OS v1.0 — Initial Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 2. Enums
-- ============================================================
CREATE TYPE project_status   AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE phase_status     AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE goal_type        AS ENUM ('annual', 'quarterly', 'monthly', 'weekly');
CREATE TYPE goal_status      AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE priority_level   AS ENUM ('urgent_important', 'important_not_urgent', 'urgent_not_important', 'not_urgent_not_important');
CREATE TYPE effort_level     AS ENUM ('low', 'medium', 'high');
CREATE TYPE idea_status      AS ENUM ('active', 'archived', 'converted');


-- 3. Tables
-- ============================================================

-- 3.1 profiles
-- Linked to auth.users via trigger on sign-up
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.2 settings
-- Single row per user, all preferences in one JSONB blob
CREATE TABLE settings (
  user_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  settings  JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.3 projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  goal        TEXT,
  status      project_status NOT NULL DEFAULT 'planning',
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- 3.4 project_phases
CREATE TABLE project_phases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      phase_status NOT NULL DEFAULT 'pending',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- 3.5 project_tasks
CREATE TABLE project_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- 3.6 project_risks
CREATE TABLE project_risks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  risk        TEXT NOT NULL,
  probability TEXT NOT NULL DEFAULT 'medium',   -- low / medium / high
  impact      TEXT NOT NULL DEFAULT 'medium',   -- low / medium / high
  mitigation  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- 3.7 goals
-- Self-referencing hierarchy: quarterly → annual, monthly → quarterly, weekly → monthly
CREATE TABLE goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  goal_type      goal_type NOT NULL,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  period_start   DATE,
  period_end     DATE,
  status         goal_status NOT NULL DEFAULT 'active',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

-- 3.8 goal_indicators
CREATE TABLE goal_indicators (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  target     TEXT,
  current    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.9 goal_tasks
CREATE TABLE goal_tasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.10 daily_plans
CREATE TABLE daily_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  notes          TEXT,
  blockers       TEXT,
  tomorrow_plan  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ,
  UNIQUE(user_id, date)
);

-- 3.11 daily_tasks
CREATE TABLE daily_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id  UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  text           TEXT NOT NULL,
  priority       priority_level NOT NULL DEFAULT 'important_not_urgent',
  done           BOOLEAN NOT NULL DEFAULT false,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

-- 3.12 ideas
CREATE TABLE ideas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  category              TEXT,
  effort                effort_level NOT NULL DEFAULT 'medium',
  expected_return       effort_level NOT NULL DEFAULT 'medium',
  priority              effort_level NOT NULL DEFAULT 'medium',
  status                idea_status NOT NULL DEFAULT 'active',
  converted_project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ
);

-- 3.13 decisions
CREATE TABLE decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  reason           TEXT,
  alternatives     TEXT[],
  expected_impact  TEXT,
  actual_result    TEXT,
  decided_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ
);

-- 3.14 metric_categories
CREATE TABLE metric_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,                             -- lucide icon name e.g. 'BookOpen', 'Code'
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3.15 metric_values
-- Immutable history: each update inserts a new row.
-- Query latest by: DISTINCT ON (category_id, label) ORDER BY recorded_at DESC
CREATE TABLE metric_values (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES metric_categories(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  current_value TEXT NOT NULL DEFAULT '0',
  target_value  TEXT,
  progress      INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  recorded_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.16 progress_logs
CREATE TABLE progress_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  tasks_completed  TEXT,
  learning_hours   NUMERIC(4,1) NOT NULL DEFAULT 0,
  dev_hours        NUMERIC(4,1) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ,
  UNIQUE(user_id, date)
);

-- 3.17 activity_log
-- Populated by Service Layer, NOT by database triggers.
-- Used for: dashboard feed, AI context, Realtime notifications.
CREATE TABLE activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,                 -- e.g. 'project_created', 'task_completed'
  entity_type   TEXT,                          -- e.g. 'project', 'goal', 'idea'
  entity_id     UUID,                          -- polymorphic reference
  description   TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 4. Indexes
-- ============================================================

-- Profiles
-- (PK index on id is automatic)

-- Settings
-- (PK index on user_id is automatic)

-- Projects
CREATE INDEX idx_projects_user       ON projects(user_id);
CREATE INDEX idx_projects_status     ON projects(status) WHERE deleted_at IS NULL;

-- Project children (FK lookups)
CREATE INDEX idx_phases_project      ON project_phases(project_id);
CREATE INDEX idx_tasks_project       ON project_tasks(project_id);
CREATE INDEX idx_risks_project       ON project_risks(project_id);

-- Goals
CREATE INDEX idx_goals_user          ON goals(user_id);
CREATE INDEX idx_goals_type          ON goals(goal_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_parent        ON goals(parent_goal_id);

-- Goal children
CREATE INDEX idx_indicators_goal     ON goal_indicators(goal_id);
CREATE INDEX idx_goal_tasks_goal     ON goal_tasks(goal_id);

-- Daily
CREATE INDEX idx_daily_plan_date     ON daily_plans(user_id, date);
CREATE INDEX idx_daily_tasks_plan    ON daily_tasks(daily_plan_id);

-- Ideas
CREATE INDEX idx_ideas_user              ON ideas(user_id);
CREATE INDEX idx_ideas_status            ON ideas(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_ideas_converted_project ON ideas(converted_project_id);

-- Decisions
CREATE INDEX idx_decisions_user      ON decisions(user_id);
CREATE INDEX idx_decisions_date      ON decisions(decided_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_decisions_project   ON decisions(project_id);

-- Metrics
CREATE INDEX idx_metric_cats_user    ON metric_categories(user_id);
CREATE INDEX idx_metric_vals_cat     ON metric_values(category_id);
CREATE INDEX idx_metric_vals_latest  ON metric_values(category_id, label, recorded_at DESC);

-- Progress
CREATE INDEX idx_progress_user_date  ON progress_logs(user_id, date);

-- Activity
CREATE INDEX idx_activity_user       ON activity_log(user_id);
CREATE INDEX idx_activity_feed       ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_type       ON activity_log(activity_type);
CREATE INDEX idx_activity_entity     ON activity_log(entity_type, entity_id);


-- 5. Functions & Triggers
-- ============================================================

-- updated_at auto-setter (for every table that has updated_at)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_phases_updated_at
  BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_project_risks_updated_at
  BEFORE UPDATE ON project_risks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_indicators_updated_at
  BEFORE UPDATE ON goal_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_goal_tasks_updated_at
  BEFORE UPDATE ON goal_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_daily_plans_updated_at
  BEFORE UPDATE ON daily_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ideas_updated_at
  BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_decisions_updated_at
  BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_metric_cats_updated_at
  BEFORE UPDATE ON metric_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_progress_logs_updated_at
  BEFORE UPDATE ON progress_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user_profile
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- 6. Row Level Security
-- ============================================================

-- 6.1 profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "User can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "User can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 6.2 settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own settings"
  ON settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own settings"
  ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own settings"
  ON settings FOR UPDATE USING (auth.uid() = user_id);

-- 6.3 projects (with soft delete: SELECT excludes deleted rows)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own non-deleted projects"
  ON projects FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "User can insert own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can soft-delete own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- 6.4 project_phases (ownership via parent project, respects soft delete)
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own project phases"
  ON project_phases FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own project phases"
  ON project_phases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can update own project phases"
  ON project_phases FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can delete own project phases"
  ON project_phases FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
  );

-- 6.5 project_tasks (respects parent soft delete)
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own project tasks"
  ON project_tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own project tasks"
  ON project_tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can update own project tasks"
  ON project_tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can delete own project tasks"
  ON project_tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
  );

-- 6.6 project_risks (respects parent soft delete)
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own project risks"
  ON project_risks FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_risks.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own project risks"
  ON project_risks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_risks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can update own project risks"
  ON project_risks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_risks.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "User can delete own project risks"
  ON project_risks FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_risks.project_id AND projects.user_id = auth.uid())
  );

-- 6.7 goals (with soft delete)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own non-deleted goals"
  ON goals FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "User can insert own goals"
  ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own goals"
  ON goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can soft-delete own goals"
  ON goals FOR DELETE USING (auth.uid() = user_id);

-- 6.8 goal_indicators (respects parent soft delete)
ALTER TABLE goal_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own goal indicators"
  ON goal_indicators FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_indicators.goal_id AND goals.user_id = auth.uid() AND goals.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own goal indicators"
  ON goal_indicators FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_indicators.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "User can update own goal indicators"
  ON goal_indicators FOR UPDATE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_indicators.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "User can delete own goal indicators"
  ON goal_indicators FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_indicators.goal_id AND goals.user_id = auth.uid())
  );

-- 6.9 goal_tasks (respects parent soft delete)
ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own goal tasks"
  ON goal_tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_tasks.goal_id AND goals.user_id = auth.uid() AND goals.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own goal tasks"
  ON goal_tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_tasks.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "User can update own goal tasks"
  ON goal_tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_tasks.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "User can delete own goal tasks"
  ON goal_tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_tasks.goal_id AND goals.user_id = auth.uid())
  );

-- 6.10 daily_plans
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own daily plans"
  ON daily_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own daily plans"
  ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own daily plans"
  ON daily_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete own daily plans"
  ON daily_plans FOR DELETE USING (auth.uid() = user_id);

-- 6.11 daily_tasks
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own daily tasks"
  ON daily_tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_tasks.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can insert own daily tasks"
  ON daily_tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_tasks.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can update own daily tasks"
  ON daily_tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_tasks.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can delete own daily tasks"
  ON daily_tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_tasks.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

-- 6.12 ideas (with soft delete)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own non-deleted ideas"
  ON ideas FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "User can insert own ideas"
  ON ideas FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own ideas"
  ON ideas FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can soft-delete own ideas"
  ON ideas FOR DELETE USING (auth.uid() = user_id);

-- 6.13 decisions (with soft delete)
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own non-deleted decisions"
  ON decisions FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "User can insert own decisions"
  ON decisions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own decisions"
  ON decisions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can soft-delete own decisions"
  ON decisions FOR DELETE USING (auth.uid() = user_id);

-- 6.14 metric_categories
ALTER TABLE metric_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own metric categories"
  ON metric_categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own metric categories"
  ON metric_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own metric categories"
  ON metric_categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete own metric categories"
  ON metric_categories FOR DELETE USING (auth.uid() = user_id);

-- 6.15 metric_values
ALTER TABLE metric_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own metric values"
  ON metric_values FOR SELECT USING (
    EXISTS (SELECT 1 FROM metric_categories WHERE metric_categories.id = metric_values.category_id AND metric_categories.user_id = auth.uid())
  );

CREATE POLICY "User can insert own metric values"
  ON metric_values FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM metric_categories WHERE metric_categories.id = metric_values.category_id AND metric_categories.user_id = auth.uid())
  );

CREATE POLICY "User can delete own metric values"
  ON metric_values FOR DELETE USING (
    EXISTS (SELECT 1 FROM metric_categories WHERE metric_categories.id = metric_values.category_id AND metric_categories.user_id = auth.uid())
  );

-- 6.16 progress_logs
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own progress logs"
  ON progress_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own progress logs"
  ON progress_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own progress logs"
  ON progress_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete own progress logs"
  ON progress_logs FOR DELETE USING (auth.uid() = user_id);

-- 6.17 activity_log (read-only via RLS, writes via Service Layer)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own activity"
  ON activity_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert activity"
  ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 7. Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
