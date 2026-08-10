/**
 * Database types.
 *
 * Regenerate after every migration — do not hand-edit:
 *
 *   npx supabase gen types typescript --local \
 *     > libs/shared/database-types/src/lib/database.types.ts
 *
 * (This file was written by hand to match supabase/migrations/20260810000000_rbac.sql
 * because the local stack was not running; regenerate to pick up drift.)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          disabled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          disabled_at?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          disabled_at?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          granted_by: string | null;
          granted_at: string;
        };
        Insert: {
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          granted_by?: string | null;
        };
        Update: {
          role?: Database['public']['Enums']['app_role'];
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: number;
          role: Database['public']['Enums']['app_role'];
          permission: Database['public']['Enums']['app_permission'];
        };
        Insert: {
          role: Database['public']['Enums']['app_role'];
          permission: Database['public']['Enums']['app_permission'];
        };
        Update: {
          role?: Database['public']['Enums']['app_role'];
          permission?: Database['public']['Enums']['app_permission'];
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body: string | null;
          action_url: string | null;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body?: string | null;
          action_url?: string | null;
          metadata?: Json;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      role_audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          subject_id: string;
          action: 'grant' | 'revoke' | 'invite' | 'disable' | 'enable';
          role: Database['public']['Enums']['app_role'] | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          subject_id: string;
          action: 'grant' | 'revoke' | 'invite' | 'disable' | 'enable';
          role?: Database['public']['Enums']['app_role'] | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      authorize: {
        Args: { requested_permission: Database['public']['Enums']['app_permission'] };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'admin' | 'manager' | 'support' | 'member';
      notification_type:
        | 'role.granted'
        | 'role.revoked'
        | 'user.invited'
        | 'user.disabled'
        | 'user.enabled'
        | 'system';
      app_permission:
        | 'users.read'
        | 'users.invite'
        | 'users.update'
        | 'users.disable'
        | 'roles.read'
        | 'roles.assign'
        | 'audit.read';
    };
    CompositeTypes: Record<never, never>;
  };
}
