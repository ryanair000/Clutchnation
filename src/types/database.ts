/**
 * Auto-generated Supabase types placeholder.
 * Replace with output of: npx supabase gen types typescript --linked
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          psn_online_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          country: string;
          timezone: string;
          is_admin: boolean;
          is_banned: boolean;
          psn_data: Record<string, unknown> | null;
          psn_data_fetched_at: string | null;
          psn_account_id: string | null;
          psn_verified_status: string;
          psn_profile_url: string | null;
          psn_sync_status: string;
          psn_public_last_synced_at: string | null;
          psn_last_lookup_error: string | null;
          stats_matches_played: number;
          stats_matches_won: number;
          stats_tournaments_played: number;
          stats_tournaments_won: number;
          stats_goals_for: number;
          stats_goals_against: number;
          favorite_games: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          psn_online_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string;
          timezone?: string;
          is_admin?: boolean;
          is_banned?: boolean;
          psn_data?: Record<string, unknown> | null;
          psn_data_fetched_at?: string | null;
          psn_account_id?: string | null;
          psn_verified_status?: string;
          psn_profile_url?: string | null;
          psn_sync_status?: string;
          psn_public_last_synced_at?: string | null;
          psn_last_lookup_error?: string | null;
          stats_matches_played?: number;
          stats_matches_won?: number;
          stats_tournaments_played?: number;
          stats_tournaments_won?: number;
          stats_goals_for?: number;
          stats_goals_against?: number;
          favorite_games?: string[];
        };
        Update: {
          username?: string | null;
          psn_online_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          country?: string;
          timezone?: string;
          psn_data?: Record<string, unknown> | null;
          psn_data_fetched_at?: string | null;
          psn_account_id?: string | null;
          psn_verified_status?: string;
          psn_profile_url?: string | null;
          psn_sync_status?: string;
          psn_public_last_synced_at?: string | null;
          psn_last_lookup_error?: string | null;
          favorite_games?: string[];
        };
      };
      tournaments: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          description: string | null;
          game: string;
          mode: string;
          size: number;
          format: string;
          rules_half_length_min: number;
          status: string;
          current_round: number;
          registration_closes_at: string;
          starts_at: string;
          ended_at: string | null;
          winner_id: string | null;
          banner_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          description?: string | null;
          game?: string;
          mode: string;
          size: number;
          format?: string;
          rules_half_length_min?: number;
          status?: string;
          current_round?: number;
          registration_closes_at: string;
          starts_at: string;
          ended_at?: string | null;
          winner_id?: string | null;
          banner_url?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          mode?: string;
          size?: number;
          rules_half_length_min?: number;
          status?: string;
          current_round?: number;
          registration_closes_at?: string;
          starts_at?: string;
          ended_at?: string | null;
          winner_id?: string | null;
          banner_url?: string | null;
        };
      };
      tournament_participants: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string;
          seed: number | null;
          status: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id: string;
          seed?: number | null;
          status?: string;
        };
        Update: {
          seed?: number | null;
          status?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          match_type: string;
          tournament_id: string | null;
          round: number | null;
          bracket_position: number | null;
          player_home_id: string | null;
          player_away_id: string | null;
          status: string;
          scheduled_at: string;
          slot_end_at: string;
          no_show_deadline: string;
          score_home: number | null;
          score_away: number | null;
          home_reported_score_home: number | null;
          home_reported_score_away: number | null;
          away_reported_score_home: number | null;
          away_reported_score_away: number | null;
          winner_id: string | null;
          result_confirmed_at: string | null;
          dispute_opened_at: string | null;
          dispute_resolved_at: string | null;
          dispute_resolved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_type: string;
          tournament_id?: string | null;
          round?: number | null;
          bracket_position?: number | null;
          player_home_id?: string | null;
          player_away_id?: string | null;
          status?: string;
          scheduled_at: string;
          slot_end_at: string;
          no_show_deadline: string;
          score_home?: number | null;
          score_away?: number | null;
          winner_id?: string | null;
        };
        Update: {
          status?: string;
          score_home?: number | null;
          score_away?: number | null;
          home_reported_score_home?: number | null;
          home_reported_score_away?: number | null;
          away_reported_score_home?: number | null;
          away_reported_score_away?: number | null;
          winner_id?: string | null;
          result_confirmed_at?: string | null;
          dispute_opened_at?: string | null;
          dispute_resolved_at?: string | null;
          dispute_resolved_by?: string | null;
        };
      };
      match_evidence: {
        Row: {
          id: string;
          match_id: string;
          uploaded_by: string;
          image_path: string;
          image_url: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          uploaded_by: string;
          image_path: string;
          image_url: string;
        };
        Update: {
          image_path?: string;
          image_url?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          channel_type: string;
          channel_id: string;
          sender_id: string;
          body: string;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_type: string;
          channel_id: string;
          sender_id: string;
          body: string;
          is_deleted?: boolean;
        };
        Update: {
          body?: string;
          is_deleted?: boolean;
        };
      };
      dm_threads: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          last_message_at?: string | null;
        };
        Update: {
          last_message_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details: string | null;
          context_type: string | null;
          context_id: string | null;
          status: string;
          admin_notes: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details?: string | null;
          context_type?: string | null;
          context_id?: string | null;
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Record<string, unknown> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Record<string, unknown> | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      leaderboard_snapshots: {
        Row: {
          id: string;
          user_id: string;
          season: string;
          mode: string;
          matches_played: number;
          matches_won: number;
          win_rate: number;
          goals_for: number;
          goals_against: number;
          goal_diff: number;
          tournaments_won: number;
          points: number;
          rank: number | null;
          computed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          season: string;
          mode: string;
          matches_played?: number;
          matches_won?: number;
          win_rate?: number;
          goals_for?: number;
          goals_against?: number;
          goal_diff?: number;
          tournaments_won?: number;
          points?: number;
          rank?: number | null;
        };
        Update: {
          matches_played?: number;
          matches_won?: number;
          win_rate?: number;
          goals_for?: number;
          goals_against?: number;
          goal_diff?: number;
          tournaments_won?: number;
          points?: number;
          rank?: number | null;
          computed_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          metadata: Record<string, unknown> | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          enabled?: boolean;
          metadata?: Record<string, unknown> | null;
        };
      };
      psn_profile_cache: {
        Row: {
          psn_account_id: string;
          online_id: string;
          avatar_url: string | null;
          about_me: string | null;
          is_plus: boolean | null;
          trophy_level: number | null;
          trophy_progress: number | null;
          trophy_counts: Record<string, unknown> | null;
          presence: Record<string, unknown> | null;
          current_title_name: string | null;
          current_title_id: string | null;
          current_platform: string | null;
          fc26_last_played_at: string | null;
          fc26_play_duration: string | null;
          share_url: string | null;
          fetched_at: string;
        };
        Insert: {
          psn_account_id: string;
          online_id: string;
          avatar_url?: string | null;
          about_me?: string | null;
          is_plus?: boolean | null;
          trophy_level?: number | null;
          trophy_progress?: number | null;
          trophy_counts?: Record<string, unknown> | null;
          presence?: Record<string, unknown> | null;
          current_title_name?: string | null;
          current_title_id?: string | null;
          current_platform?: string | null;
          fc26_last_played_at?: string | null;
          fc26_play_duration?: string | null;
          share_url?: string | null;
        };
        Update: {
          online_id?: string;
          avatar_url?: string | null;
          about_me?: string | null;
          is_plus?: boolean | null;
          trophy_level?: number | null;
          trophy_progress?: number | null;
          trophy_counts?: Record<string, unknown> | null;
          presence?: Record<string, unknown> | null;
          current_title_name?: string | null;
          current_title_id?: string | null;
          current_platform?: string | null;
          fc26_last_played_at?: string | null;
          fc26_play_duration?: string | null;
          share_url?: string | null;
          fetched_at?: string;
        };
      };
      psn_link_events: {
        Row: {
          id: string;
          user_id: string;
          psn_account_id: string | null;
          event_type: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          psn_account_id?: string | null;
          event_type: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
      };
      psn_service_tokens: {
        Row: {
          id: number;
          refresh_token: string;
          access_token: string | null;
          access_token_expires_at: string | null;
          refresh_token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          refresh_token: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          refresh_token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          refresh_token?: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          refresh_token_expires_at?: string | null;
          updated_at?: string;
        };
      };
      user_stream_channels: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          channel_name: string;
          channel_id: string | null;
          channel_url: string;
          is_live: boolean;
          stream_title: string | null;
          viewer_count: number;
          thumbnail_url: string | null;
          game_name: string | null;
          started_at: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          channel_name: string;
          channel_id?: string | null;
          channel_url: string;
          is_live?: boolean;
          stream_title?: string | null;
          viewer_count?: number;
          thumbnail_url?: string | null;
          game_name?: string | null;
          started_at?: string | null;
          last_synced_at?: string | null;
        };
        Update: {
          channel_name?: string;
          channel_id?: string | null;
          channel_url?: string;
          is_live?: boolean;
          stream_title?: string | null;
          viewer_count?: number;
          thumbnail_url?: string | null;
          game_name?: string | null;
          started_at?: string | null;
          last_synced_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
