export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          user_id: string
          settings: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          user_id: string
          settings?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          goal: string | null
          status: Database["public"]["Enums"]["project_status"]
          deleted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          goal?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          goal?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      project_phases: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          status: Database["public"]["Enums"]["phase_status"]
          sort_order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_tasks: {
        Row: {
          id: string
          project_id: string
          text: string
          done: boolean
          sort_order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          text: string
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          text?: string
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_risks: {
        Row: {
          id: string
          project_id: string
          risk: string
          probability: string
          impact: string
          mitigation: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          risk: string
          probability?: string
          impact?: string
          mitigation?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          risk?: string
          probability?: string
          impact?: string
          mitigation?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          parent_goal_id: string | null
          period_start: string | null
          period_end: string | null
          status: Database["public"]["Enums"]["goal_status"]
          sort_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          parent_goal_id?: string | null
          period_start?: string | null
          period_end?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          sort_order?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          parent_goal_id?: string | null
          period_start?: string | null
          period_end?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          sort_order?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      goal_indicators: {
        Row: {
          id: string
          goal_id: string
          label: string
          target: string | null
          current: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          goal_id: string
          label: string
          target?: string | null
          current?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          goal_id?: string
          label?: string
          target?: string | null
          current?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_indicators_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      goal_tasks: {
        Row: {
          id: string
          goal_id: string
          text: string
          done: boolean
          sort_order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          goal_id: string
          text: string
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          goal_id?: string
          text?: string
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          date: string
          notes: string | null
          blockers: string | null
          tomorrow_plan: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          notes?: string | null
          blockers?: string | null
          tomorrow_plan?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          notes?: string | null
          blockers?: string | null
          tomorrow_plan?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_tasks: {
        Row: {
          id: string
          daily_plan_id: string
          text: string
          priority: Database["public"]["Enums"]["priority_level"]
          done: boolean
          sort_order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          daily_plan_id: string
          text: string
          priority?: Database["public"]["Enums"]["priority_level"]
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          daily_plan_id?: string
          text?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          done?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_task_assignments: {
        Row: {
          id: string
          daily_plan_id: string
          project_task_id: string | null
          goal_task_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          daily_plan_id: string
          project_task_id?: string | null
          goal_task_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          daily_plan_id?: string
          project_task_id?: string | null
          goal_task_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_assignments_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_task_assignments_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_task_assignments_goal_task_id_fkey"
            columns: ["goal_task_id"]
            isOneToOne: false
            referencedRelation: "goal_tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          effort: Database["public"]["Enums"]["effort_level"]
          expected_return: Database["public"]["Enums"]["effort_level"]
          priority: Database["public"]["Enums"]["effort_level"]
          status: Database["public"]["Enums"]["idea_status"]
          converted_project_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          effort?: Database["public"]["Enums"]["effort_level"]
          expected_return?: Database["public"]["Enums"]["effort_level"]
          priority?: Database["public"]["Enums"]["effort_level"]
          status?: Database["public"]["Enums"]["idea_status"]
          converted_project_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          effort?: Database["public"]["Enums"]["effort_level"]
          expected_return?: Database["public"]["Enums"]["effort_level"]
          priority?: Database["public"]["Enums"]["effort_level"]
          status?: Database["public"]["Enums"]["idea_status"]
          converted_project_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      decisions: {
        Row: {
          id: string
          user_id: string
          title: string
          reason: string | null
          alternatives: string[] | null
          expected_impact: string | null
          actual_result: string | null
          decided_at: string
          project_id: string | null
          goal_id: string | null
          idea_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          reason?: string | null
          alternatives?: string[] | null
          expected_impact?: string | null
          actual_result?: string | null
          decided_at?: string
          project_id?: string | null
          goal_id?: string | null
          idea_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          reason?: string | null
          alternatives?: string[] | null
          expected_impact?: string | null
          actual_result?: string | null
          decided_at?: string
          project_id?: string | null
          goal_id?: string | null
          idea_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          }
        ]
      }
      project_goals: {
        Row: {
          project_id: string
          goal_id: string
          created_at: string
        }
        Insert: {
          project_id: string
          goal_id: string
          created_at?: string
        }
        Update: {
          project_id?: string
          goal_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      metric_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          sort_order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      metric_values: {
        Row: {
          id: string
          category_id: string
          label: string
          current_value: string
          target_value: string | null
          progress: number
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          label: string
          current_value?: string
          target_value?: string | null
          progress?: number
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          label?: string
          current_value?: string
          target_value?: string | null
          progress?: number
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_values_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "metric_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      progress_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          tasks_completed: string | null
          learning_hours: number
          dev_hours: number
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          tasks_completed?: string | null
          learning_hours?: number
          dev_hours?: number
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          tasks_completed?: string | null
          learning_hours?: number
          dev_hours?: number
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          entity_type: string | null
          entity_id: string | null
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          entity_type?: string | null
          entity_id?: string | null
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      project_status: "planning" | "active" | "on_hold" | "completed" | "archived"
      phase_status: "pending" | "in_progress" | "completed"
      goal_type: "annual" | "quarterly" | "monthly" | "weekly"
      goal_status: "active" | "completed" | "cancelled"
      priority_level: "urgent_important" | "important_not_urgent" | "urgent_not_important" | "not_urgent_not_important"
      effort_level: "low" | "medium" | "high"
      idea_status: "active" | "archived" | "converted"
    }
    CompositeTypes: Record<string, never>
  }
}
