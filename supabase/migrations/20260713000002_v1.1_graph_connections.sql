-- ============================================================
-- CEO OS v1.1 — Graph Connections
-- Adds cross-entity relationships: junction tables + extended FKs
-- ============================================================

-- 1. project_goals — Many-to-Many: Projects ↔ Goals
-- ============================================================
CREATE TABLE project_goals (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, goal_id)
);

-- Indexes
CREATE INDEX idx_project_goals_project ON project_goals(project_id);
CREATE INDEX idx_project_goals_goal    ON project_goals(goal_id);

-- RLS
ALTER TABLE project_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own project-goal links"
  ON project_goals FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_goals.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
  );

CREATE POLICY "User can insert own project-goal links"
  ON project_goals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_goals.project_id AND projects.user_id = auth.uid() AND projects.deleted_at IS NULL)
    AND
    EXISTS (SELECT 1 FROM goals WHERE goals.id = project_goals.goal_id AND goals.user_id = auth.uid() AND goals.deleted_at IS NULL)
  );

CREATE POLICY "User can delete own project-goal links"
  ON project_goals FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_goals.project_id AND projects.user_id = auth.uid())
  );


-- 2. decisions — Extend to link to goals and ideas
-- ============================================================
ALTER TABLE decisions ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE decisions ADD COLUMN idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_decisions_goal_id ON decisions(goal_id);
CREATE INDEX idx_decisions_idea_id ON decisions(idea_id);

-- RLS policies already cover the table. New columns are just additional nullable FKs.
-- No new RLS needed — existing policies apply to the row as a whole.


-- 3. daily_task_assignments — Daily Plan ↔ Project/Goal Tasks (Reference only)
-- ============================================================
CREATE TABLE daily_task_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id   UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  project_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
  goal_task_id    UUID REFERENCES goal_tasks(id) ON DELETE SET NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Exactly one source task per assignment
  CHECK (
    (project_task_id IS NOT NULL AND goal_task_id IS NULL) OR
    (project_task_id IS NULL AND goal_task_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_daily_assign_plan    ON daily_task_assignments(daily_plan_id);
CREATE INDEX idx_daily_assign_project ON daily_task_assignments(project_task_id);
CREATE INDEX idx_daily_assign_goal    ON daily_task_assignments(goal_task_id);

-- RLS
ALTER TABLE daily_task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own daily task assignments"
  ON daily_task_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_task_assignments.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can insert into own daily assignments"
  ON daily_task_assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_task_assignments.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can update own daily assignments"
  ON daily_task_assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_task_assignments.daily_plan_id AND daily_plans.user_id = auth.uid())
  );

CREATE POLICY "User can delete own daily assignments"
  ON daily_task_assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM daily_plans WHERE daily_plans.id = daily_task_assignments.daily_plan_id AND daily_plans.user_id = auth.uid())
  );


-- 4. Realtime — Add new tables for live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE daily_task_assignments;
