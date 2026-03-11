# ClutchNation — Complete Platform Documentation

---

## Table of Contents

1. [What Is ClutchNation?](#what-is-clutchnation)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
   - 4.1 [Tournaments](#1-tournaments)
   - 4.2 [Standalone 1v1 Challenges](#2-standalone-1v1-challenges)
   - 4.3 [Score Reporting & Dispute Resolution](#3-score-reporting--dispute-resolution)
   - 4.4 [Leaderboards & Rankings](#4-leaderboards--rankings)
   - 4.5 [Player Profiles & Stats](#5-player-profiles--stats)
   - 4.6 [Messaging](#6-messaging)
   - 4.7 [Reporting & Moderation](#7-reporting--moderation)
   - 4.8 [Admin Panel](#8-admin-panel)
   - 4.9 [Notifications](#9-notifications)
5. [User Flows](#user-flows)
6. [Authentication & Route Protection](#authentication--route-protection)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
10. [Storage Buckets](#storage-buckets)
11. [Design System](#design-system)
12. [Components Reference](#components-reference)
13. [Utility Libraries](#utility-libraries)
14. [Constants & Configuration](#constants--configuration)
15. [Security & Validation](#security--validation)
16. [Key Design Decisions](#key-design-decisions)

---

## What Is ClutchNation?

ClutchNation is a **competitive esports platform** built for the **EA SPORTS FC 26 (PlayStation)** community in **Kenya and East Africa**. It provides a structured ecosystem where players can host and join tournaments, challenge rivals to 1v1 matches, climb seasonal leaderboards, and communicate — all in one place.

The platform is community-first: designed around the East Africa timezone (`Africa/Nairobi`), local player culture, and fair-play principles backed by evidence-based dispute resolution and admin moderation.

**Key value propositions:**
- Organize single-elimination tournaments from 2 to 32 players across 1v1, 2v2, and Pro Clubs modes
- Challenge any player to a standalone match with a dual-report score verification system
- Climb seasonal leaderboards with a transparent points system
- Communicate with opponents via real-time direct messaging
- Report cheaters; admins resolve disputes with screenshot evidence and a full audit trail
- PlayStation Network (PSN) identity integration for trust and verification

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Server components by default, client components where interactivity is needed |
| **Styling** | Tailwind CSS 3, class-variance-authority, tailwind-merge, clsx | Custom design tokens for brand, accent, surface, and ink colors |
| **Backend/DB** | Supabase (PostgreSQL 15, Auth, Realtime, Storage, Edge Functions) | RLS on every table, triggers for auto-profile creation and `updated_at` |
| **Validation** | Zod 3.24 | Client-side and server-side schema validation |
| **Auth** | Supabase Auth with SSR cookie handling | Email/password + Google OAuth; middleware-enforced route protection |
| **Date Handling** | date-fns 3.6, date-fns-tz 3.2 | All dates displayed in `Africa/Nairobi` timezone |
| **Icons** | Lucide React 0.469 | Consistent icon library across the UI |
| **Hosting** | Netlify | Via `@netlify/plugin-nextjs`, build command: `npm run build`, publish: `.next` |
| **Game** | EA SPORTS FC 26 | PlayStation platform only |

### Build & Dev Commands

```bash
npm run dev          # Start development server (next dev)
npm run build        # Production build (next build)
npm run start        # Start production server (next start)
npm run lint         # ESLint check (next lint)
npm run type-check   # TypeScript type check (tsc --noEmit)
```

### External Services & Allowed Domains

Images are optimized via Next.js Image with these allowed remote domains:
- `beuxwonfnbnjwcjpsqfg.supabase.co` — Supabase Storage (avatars, evidence)
- `image.api.playstation.com` — PSN avatar images

---

## Project Structure

```
src/
  app/                           # Next.js App Router pages
    layout.tsx                   # Root layout (fonts, header, footer, metadata)
    page.tsx                     # Homepage (ISR, 60s revalidation)
    error.tsx                    # Global error boundary
    not-found.tsx                # 404 page
    (auth)/                      # Auth route group (shared auth layout)
      layout.tsx                 # Centered card layout for auth pages
      login/page.tsx             # Login page + LoginForm
      signup/page.tsx            # Signup page + SignupForm
      forgot-password/page.tsx   # Password reset page + ForgotPasswordForm
    admin/                       # Admin panel (requires is_admin)
      layout.tsx                 # Admin sidebar + nav layout
      loading.tsx                # Admin loading skeleton
      page.tsx                   # Admin dashboard (stats, quick actions, recent audit)
      users/page.tsx             # User management (search, ban/unban, promote/demote)
      disputes/page.tsx          # Dispute resolution (set final scores)
      reports/page.tsx           # Report review (tabs by status)
      audit-log/page.tsx         # Full audit log (paginated, filterable)
    api/                         # API route handlers
      admin/
        disputes/[id]/route.ts   # PATCH — resolve disputed match
        reports/[id]/route.ts    # PATCH — update report status
        users/[id]/route.ts      # PATCH — ban/unban/promote/demote
      leaderboards/
        compute/route.ts         # POST — compute seasonal snapshots
      matches/
        create/route.ts          # POST — create standalone 1v1 match
        evidence/route.ts        # POST — upload match evidence
      messages/
        threads/route.ts         # POST — create DM thread
        send/route.ts            # POST — send message in thread
      psn/
        lookup/[onlineId]/route.ts  # GET — PSN profile lookup (feature-flagged)
      reports/
        create/route.ts          # POST — submit player report
      tournaments/
        [id]/start/route.ts      # POST — start tournament (seed + bracket)
        [id]/report/route.ts     # POST — report tournament match score
    auth/
      callback/route.ts          # OAuth callback handler
    banned/page.tsx              # Banned user notice page
    dashboard/page.tsx           # User dashboard (matches, tournaments, notifications)
    leaderboards/page.tsx        # Seasonal leaderboard (filterable by mode)
    matches/
      [id]/page.tsx              # Match detail (scores, actions, evidence)
      create/page.tsx            # Create 1v1 challenge form
    messages/
      page.tsx                   # DM thread list
      [threadId]/page.tsx        # Chat thread (real-time)
      new/page.tsx               # New message form
    onboarding/page.tsx          # First-time profile setup
    profile/[username]/page.tsx  # Public player profile + stats
    settings/profile/page.tsx    # Edit own profile + avatar upload
    tournaments/
      page.tsx                   # Tournament listing (cards grid)
      [id]/page.tsx              # Tournament detail (bracket, participants)
      create/page.tsx            # Create tournament form

  components/
    admin/                       # Admin-only components
      dispute-list.tsx           # Active + resolved disputes UI
      reports-list.tsx           # Tabbed report management
      user-management-table.tsx  # Searchable, filterable user table
    layout/                      # App shell components
      header.tsx                 # Sticky header with nav + user menu
      footer.tsx                 # Platform footer
      mobile-menu.tsx            # Mobile hamburger drawer
      user-nav.tsx               # User avatar dropdown
    leaderboards/
      leaderboard-table.tsx      # Ranked player table with medals
      mode-filter.tsx            # Mode pill button group
    matches/
      create-match-form.tsx      # 1v1 match creation form
      evidence-upload.tsx        # Screenshot upload for disputes
      match-actions.tsx          # Accept/decline/report/cancel actions
    messages/
      chat-window.tsx            # Real-time chat with Supabase subscription
      new-thread-form.tsx        # Start a new DM thread
    shared/
      player-stats-panel.tsx     # Detailed stats grid with streaks + form
      profile-header.tsx         # Avatar, username, PSN, country, bio
      report-user-button.tsx     # Report modal trigger + form
      stats-grid.tsx             # Compact 4-column stats display
    tournaments/
      bracket-view.tsx           # Horizontal scrollable bracket visualization
      join-leave-button.tsx      # Join/leave tournament toggle
      participant-list.tsx       # Seeded participant grid
      report-score-form.tsx      # Score input for tournament matches
      start-tournament-button.tsx # Host-only start button with confirmation
      status-badge.tsx           # Color-coded tournament status pill

  lib/
    admin.ts                     # requireAdmin() + checkAdminApi()
    constants.ts                 # All app constants, enums, regex, points
    stats.ts                     # computePlayerStats() + getCurrentSeason()
    tournament.ts                # Bracket generation, seeding, match scheduling
    utils.ts                     # cn(), formatDate(), formatTime(), isSafeRedirect()
    supabase/
      client.ts                  # Browser Supabase client (SSR cookies)
      server.ts                  # Server Supabase client (SSR cookies)
      service.ts                 # Service-role Supabase client (admin ops)
      index.ts                   # Re-exports

  styles/
    globals.css                  # Google Fonts, Tailwind layers, custom utilities

  types/
    database.ts                  # Supabase Database type (auto-generated schema)
    index.ts                     # Domain types (Profile, Tournament, Match, etc.)

  middleware.ts                  # Auth, onboarding, and ban enforcement

supabase/
  config.toml                    # Project config (auth, storage, Google OAuth)
  migrations/
    20260305000001_initial_schema.sql       # All tables, indexes, constraints, triggers
    20260305000002_rls_policies.sql         # Row Level Security policies
    20260305000003_storage_buckets.sql      # Avatar + evidence storage buckets
    20260305000004_leaderboard_unique_constraint.sql  # Upsert support index
```

---

## Core Features

### 1. Tournaments

**Overview:** Any registered, non-banned player can host a single-elimination tournament. Tournaments are the primary competitive format on ClutchNation.

**Tournament Properties:**
| Field | Description | Constraints |
|---|---|---|
| Title | Tournament name | 3–100 characters |
| Description | Optional longer description | Up to 1,000 characters |
| Game | Always `FC26` | Fixed value |
| Mode | Play format | `1v1`, `2v2`, or `pro_clubs` |
| Size | Max participants | 2, 4, 8, 16, or 32 |
| Format | Bracket type | `single_elimination` (only format in MVP) |
| Rules — Half Length | Minutes per half | Default 6 minutes |
| Registration Closes At | Deadline for sign-ups | Must be in the future |
| Starts At | When first matches begin | Must be after registration closes |
| Banner URL | Optional banner image | Uploaded to storage |

**Status Lifecycle:**
```
registration → in_progress → completed
                           → cancelled
```

- **Registration:** Players can browse and join. Host can cancel.
- **In Progress:** Bracket is live. Matches are being played round by round. Only the host can start this transition, and it requires at least 2 participants.
- **Completed:** A winner has been crowned. `winner_id` is set.
- **Cancelled:** Terminated before or during play.

**Bracket Generation (when host starts tournament):**
1. All registered participants are **randomly shuffled** (Fisher-Yates algorithm) and assigned seeds (1-indexed).
2. The system generates **standard seeding pairs** for round 1:
   - For size 8: Seed 1 vs 8, Seed 4 vs 5, Seed 2 vs 7, Seed 3 vs 6
   - Uses recursive pair generation to produce correct bracket positioning
3. If the participant count is less than the tournament size, **byes** are auto-generated:
   - Bye matches are immediately marked `completed` with the present player as `winner_id`
   - Bye winners are automatically advanced to round 2
4. All round-1 matches are created with **time-spaced slots** (30 minutes apart by default), each with:
   - `scheduled_at` — when the match starts
   - `slot_end_at` — 30 minutes after start
   - `no_show_deadline` — 10 minutes after start
5. Tournament status updates to `in_progress` with `current_round = 1`.

**Score Reporting & Advancement:**
- Both players independently report their scores for a match.
- If scores agree → match auto-completes → winner is **advanced to the next round**.
  - The system finds the next-round bracket position and fills in the empty `player_home_id` or `player_away_id` slot.
  - If the next-round match doesn't exist yet, it is created.
- If scores disagree → match enters `disputed` status → admin resolves → winner advances.
- Tournament matches **cannot end in a draw** — there must always be a winner when the match is resolved.

**Participant States:**
- `registered` — Signed up, waiting for bracket
- `checked_in` — Reserved for future use
- `eliminated` — Lost a match
- `winner` — Won the tournament

---

### 2. Standalone 1v1 Challenges

**Overview:** Players can challenge any other player to a one-off match outside of any tournament context. These are called "standalone" matches.

**Creation Flow:**
1. The challenger (Player A) specifies:
   - **Opponent** — by username or PSN Online ID
   - **Scheduled date/time** — when they'll play on PlayStation
   - **Half length** — 4 to 10 minutes (default 6)
2. The system looks up the opponent in the `profiles` table (by `username` or `psn_online_id`).
3. A match record is created with:
   - `match_type = 'standalone'`
   - `tournament_id = NULL` (enforced by database constraint `chk_standalone_no_tournament`)
   - `player_home_id` = challenger
   - `player_away_id` = opponent
   - `status = 'pending_acceptance'`
   - `scheduled_at`, `slot_end_at` (+30 min), `no_show_deadline` (+10 min)
4. Self-challenges are prevented (server-side check).

**Match Status Lifecycle:**
```
pending_acceptance → scheduled → in_progress → completed
                   → cancelled                → disputed → completed (after admin resolve)
                                              → cancelled
                                              → no_show
```

- **Pending Acceptance:** The away player sees the challenge on their dashboard and can **accept** or **decline** (cancel).
- **Scheduled:** Both players have agreed. Awaiting match time.
- **In Progress:** Score reporting is underway. At least one player has submitted their score.
- **Completed:** Both scores match, or admin has resolved a dispute.
- **Disputed:** Scores conflict. Awaiting admin resolution.
- **Cancelled:** Either player cancelled, or the away player declined.
- **No Show:** A player didn't show up within the no-show deadline (10 minutes).

**Dual Score Reporting (Standalone Matches):**
- Each player independently reports their version of the score via the match actions UI.
- The **home player** submits `home_reported_score_home` and `home_reported_score_away`.
- The **away player** submits `away_reported_score_home` and `away_reported_score_away`.
- Once both have reported:
  - **Scores match** → Final score is set, `winner_id` is determined, status → `completed`, `result_confirmed_at` is timestamped.
  - **Scores differ** → Status → `disputed`, `dispute_opened_at` is timestamped. Both players are encouraged to upload evidence.

---

### 3. Score Reporting & Dispute Resolution

**Evidence Upload:**
- Players involved in a match (home or away) can upload a **screenshot** as evidence.
- Accepted formats: `jpg`, `jpeg`, `png`, `webp` (server-side whitelist enforced).
- Max file size: **5 MB** (validated both client-side and server-side).
- Files are stored in the Supabase `evidence` storage bucket at path: `{matchId}/{uuid}.{ext}`.
- One evidence image per player per match (enforced by `UNIQUE(match_id, uploaded_by)`).
- Evidence is accessible only to match participants and admins (RLS policy).

**Admin Dispute Resolution:**
1. Admins view all disputed matches on the `/admin/disputes` page.
2. For each dispute, the admin can see:
   - Home player's reported score
   - Away player's reported score
   - Uploaded evidence from both sides
3. The admin sets the **final score** (`score_home`, `score_away`) and optionally the `winner_id`.
4. Match status → `completed`, `dispute_resolved_at` and `dispute_resolved_by` are set.
5. For tournament matches: the winner is automatically **advanced to the next bracket round**.
6. An **audit log** entry is created recording the admin's action.

---

### 4. Leaderboards & Rankings

**Seasonal System:**
- Leaderboards are organized by **season** (current: `2026-S1`).
- Rankings are computed periodically via the `POST /api/leaderboards/compute` endpoint.
- This endpoint is protected by either a `CRON_SECRET` bearer token (for automated jobs) or admin authentication.

**Computation Logic:**
1. Fetch all non-banned profiles.
2. Fetch all completed matches.
3. For each profile, compute stats across each mode (`all`, `1v1`, `2v2`, `pro_clubs`):
   - Filter matches by mode (for tournament matches, the mode is derived from the tournament's `mode` field).
   - Count wins, draws, losses. Sum goals for and against.
   - Fetch tournament participation and win counts for bonus points.
   - Calculate `win_rate`, `goal_diff`, and total `points`.
4. Sort each mode's entries by points (descending) and assign **ranks** (1-indexed).
5. **Upsert** into `leaderboard_snapshots` (using the unique constraint on `user_id, season, mode`).

**Points System:**

| Action | Points Awarded |
|---|---|
| Match Win | 3 |
| Match Draw | 1 |
| Match Loss | 0 |
| Tournament Win | 25 |
| Tournament Runner-Up | 12 |
| Tournament Semifinal | 6 |
| Tournament Participation | 2 |

**Leaderboard Snapshot Fields:**
- `user_id`, `season`, `mode`
- `matches_played`, `matches_won`, `win_rate` (numeric, 4 decimal places)
- `goals_for`, `goals_against`, `goal_diff`
- `tournaments_won`
- `points`, `rank`
- `computed_at` (timestamp of last computation)

**UI:**
- Filterable by mode via pill button group: **Overall**, **1v1**, **2v2**, **Pro Clubs**.
- Top 3 players receive medal indicators: 🥇 🥈 🥉.
- Top 3 rows have amber-highlighted backgrounds.
- Table columns (responsive — some hidden on mobile): Rank, Player (avatar + username + PSN), Points, Played, Won, Win%, Goals For, Goals Against, Goal Diff, Tournaments Won.
- Currently shows top 100 entries per mode.

---

### 5. Player Profiles & Stats

**Profile Fields:**

| Field | Constraints | Default |
|---|---|---|
| `username` | 3–20 chars, `^[a-zA-Z0-9_]{3,20}$`, unique | NULL (set during onboarding) |
| `psn_online_id` | Starts with letter, 3–16 chars, `^[a-zA-Z][a-zA-Z0-9_-]{2,15}$`, unique | NULL |
| `avatar_url` | URL to uploaded avatar in storage | NULL |
| `bio` | Max 280 characters | NULL |
| `country` | ISO code | `KE` (Kenya) |
| `timezone` | IANA timezone | `Africa/Nairobi` |
| `is_admin` | Boolean | `false` |
| `is_banned` | Boolean | `false` |

**Aggregate Stats (stored on profile for quick access):**
- `stats_matches_played`, `stats_matches_won`
- `stats_tournaments_played`, `stats_tournaments_won`
- `stats_goals_for`, `stats_goals_against`

**Detailed Computed Stats (calculated from match history via `computePlayerStats()`):**

| Stat | Description |
|---|---|
| Total Matches | Count of completed matches |
| Wins / Losses / Draws | Breakdown by outcome |
| Win Rate | `totalWins / totalMatches` |
| Goals For / Against | Sum of goals scored / conceded |
| Goal Difference | `goalsFor - goalsAgainst` |
| Clean Sheets | Matches where opponent scored 0 |
| Avg Goals/Match | `goalsFor / totalMatches` |
| Current Streak | Length + type (W/L/D) of current run |
| Best Win Streak | Longest consecutive win run |
| Recent Form | Last 5 results as W/L/D badges |
| Tournaments Played / Won | Counts |
| Points | Calculated from the points system |
| Rank | From leaderboard snapshots |

**PSN Integration:**
- Optional PSN data fetch (feature-flagged via `psn_lookup_enabled`).
- When available, stores in `psn_data` JSONB:
  - `accountId`, `onlineId`, `avatarUrl`, `aboutMe`
  - `isPlus` (PS Plus subscriber)
  - `presenceState` (online / offline / unknown), `presenceGame`
  - `trophyLevel`, `trophySummary` (bronze, silver, gold, platinum counts)
  - `fetchedAt` timestamp
- Displayed on player profiles for credibility and community identity.

**Profile Page Sections:**
1. **ProfileHeader** — Avatar (with initials fallback), username, PSN ID badge, country flag, bio, "Edit Profile" button (own profile only).
2. **PlayerStatsPanel** — Full stats grid with color-coded values (green for wins, red for losses, accent for streaks).
3. **ReportUserButton** — Visible when viewing another player's profile.
4. **Recent Matches** — Last 10 completed matches with opponent, score, and outcome.
5. **Tournament History** — Tournaments participated in, with status and placement.

---

### 6. Messaging

**Architecture:**
- Messages are organized by **channel type** and **channel ID**:
  - `dm` — Direct message channel (channel_id = dm_thread UUID)
  - `tournament` — Tournament chat (channel_id = tournament UUID)
  - `match` — Match chat (channel_id = match UUID)
- **DM Threads** are stored in `dm_threads` with a canonical user pair (`user_a_id < user_b_id` enforced by CHECK constraint) to prevent duplicate threads.

**Creating a DM Thread:**
1. User looks up a recipient by username.
2. System checks that the recipient exists, is not the sender themselves, and has not blocked the sender.
3. User IDs are sorted alphabetically to determine `user_a_id` and `user_b_id` (canonical ordering).
4. An existing thread is looked up, or a new one is created (upsert-like behavior).
5. The initial message is inserted with `channel_type = 'dm'` and `channel_id = threadId`.
6. `dm_threads.last_message_at` is updated.

**Sending Messages:**
- User must be a participant in the DM thread.
- Block check: if either user has blocked the other, the message is rejected.
- Message body max: **2,000 characters**.
- Banned users cannot send messages (RLS policy on `messages` table).
- `dm_threads.last_message_at` is updated on every new message.

**Real-Time Chat (ChatWindow component):**
- Uses **Supabase Realtime** channel subscription to listen for `INSERT` events on the `messages` table, filtered by channel_type and channel_id.
- Initial load: last 100 messages.
- New messages appear instantly for both parties.
- Auto-scrolls to the bottom on new messages.
- Message bubbles are styled differently for sender (brand blue, right-aligned) vs. receiver (gray, left-aligned).
- Timestamps displayed in `Africa/Nairobi` timezone.

**Thread List Page:**
- Shows all DM threads the user is part of, ordered by `last_message_at` descending.
- Each thread shows the other user's avatar, username, and last message timestamp.
- "New Message" button to start a new thread.

---

### 7. Reporting & Moderation

**Player Reports:**
- Any authenticated user can report another user.
- Self-reporting is prevented.
- Duplicate open reports (same reporter → same reported user) are blocked.

**Report Fields:**

| Field | Description | Constraints |
|---|---|---|
| `reason` | Category of offense | `cheating`, `harassment`, `impersonation`, `spam`, `other` |
| `details` | Freeform explanation | Max 1,000 characters |
| `context_type` | What the report relates to | Optional (e.g., `match`, `tournament`) |
| `context_id` | UUID of the context entity | Optional |
| `status` | Current state | `open` → `reviewed` → `actioned` / `dismissed` |
| `admin_notes` | Admin's resolution notes | Set during review |
| `resolved_by` | Admin who resolved | UUID of admin |

**Report UI (ReportUserButton component):**
- Triggered from player profile pages.
- Modal with:
  - Reason dropdown (enum values).
  - Details textarea.
  - Submit button.
  - Success/error feedback.

**Admin Report Management (`/admin/reports`):**
- **Tabbed interface** with counts: Open (red), Reviewed (blue), Actioned (green), Dismissed (gray), All.
- Each report card shows: reason badge, status badge, reporter and reported user (with avatars and profile links), details, context link (if applicable).
- Admin actions: **Action** (red button), **Mark Reviewed** (blue), **Dismiss** (gray).
- Admin notes textarea for each report.
- Every status change creates an audit log entry.

**User Banning:**
- Admins can ban/unban users from `/admin/users`.
- When banned (`is_banned = true`):
  - Cannot update their own profile (RLS policy).
  - Cannot create tournaments (RLS policy).
  - Cannot send messages (RLS policy).
  - Redirected to `/banned` page on any protected route access (middleware).
- Self-banning is prevented (can't ban your own admin account).

**User Blocking:**
- Players can block other users via the `blocks` table.
- Block effects: prevents DM creation and message sending between blocked pairs.
- Only the blocker can see, create, and delete their own blocks (RLS).

---

### 8. Admin Panel

**Access Control:**
- Admin pages use `requireAdmin()` which checks `profiles.is_admin = true`. Non-admins are redirected to `/dashboard`.
- Admin API routes use `checkAdminApi()` which returns `null` for non-admins, resulting in a 403 response.

**Admin Layout:**
- Sidebar navigation with links to: Overview, Users, Matches/Disputes, Reports, Audit Log.
- All pages are server-rendered with data fetching at the page level.

**Admin Overview Page (`/admin`):**
- **Stat Cards:** Total users, total matches, total tournaments, open reports, disputed matches, banned users.
- **Quick Actions:** Links to manage users, resolve disputes, review reports.
- **Recent Audit Log:** Last few admin actions.

**User Management (`/admin/users`):**
- Search by username or PSN ID.
- Filter buttons: All, Banned, Admins.
- Paginated table (20 per page): avatar, username, joined date, PSN ID, match count, status badges (admin/banned).
- Actions per user:
  - **Ban / Unban** — toggles `is_banned`
  - **Promote / Demote** — toggles `is_admin`
  - Cannot modify own account (safeguard).
- Each action creates an audit log entry with the target user's username in metadata.

**Dispute Resolution (`/admin/disputes`):**
- **Active Disputes:** List of matches with `status = 'disputed'`.
  - Shows both players' reported scores side by side.
  - Admin sets the **final score** (home and away) and the winner.
  - For tournament matches, draws are disallowed — a winner must be selected.
  - On resolve: match is completed, and for tournament matches `advanceWinner()` pushes the winner to the next bracket slot.
- **Recently Resolved:** Shows the last resolved disputes with resolver name and timestamp.
- Confirmation dialog before resolving.

**Reports (`/admin/reports`):**
- See [Reporting & Moderation](#7-reporting--moderation) above for full details.

**Audit Log (`/admin/audit-log`):**
- Full history of all admin actions.
- Paginated (30 per page), filterable by action type.
- Each entry: action name, actor (admin), target type and ID, metadata JSON, timestamp.
- Immutable — audit log entries can never be deleted or modified by any user.

---

### 9. Notifications

**System:**
- In-app notifications stored in the `notifications` table.
- Per-user with `is_read` boolean tracking.
- Displayed on the user dashboard (latest 8 notifications).

**Notification Fields:**
| Field | Description |
|---|---|
| `user_id` | Recipient |
| `type` | Event type identifier |
| `title` | Short title text |
| `body` | Longer description (optional) |
| `data` | JSONB payload (links, IDs, etc.) |
| `is_read` | Read/unread status |
| `created_at` | Timestamp |

**Notification Events (examples):**
- Match challenge received
- Match accepted / declined
- Score dispute opened
- Tournament starting
- Tournament match scheduled
- Report outcome
- Ban notification

**RLS:** Users can only read and update their own notifications. Notifications are inserted via SECURITY DEFINER functions/triggers (open insert policy).

---

## User Flows

### New User Journey (Detailed)

1. **Arrive at homepage** (`/`) — See platform stats (player count, matches played, tournaments), feature overview, and CTAs to sign up.
2. **Sign up** (`/signup`) — Enter email + password (min 8 chars) or click "Continue with Google".
   - Email/password: Supabase sends a verification email with a confirmation link pointing to `/auth/callback?redirect=/onboarding`.
   - Google OAuth: Redirects through Google, returns to `/auth/callback`.
3. **Auth callback** (`/auth/callback`) — Exchanges the auth code for a session. Validates the redirect URL with `isSafeRedirect()`. Redirects to `/onboarding` (or `/dashboard` for returning users).
4. **Profile auto-creation** — A database trigger (`on_auth_user_created`) fires on `auth.users` insert and creates a bare `profiles` row with just the `id`. Username is still NULL.
5. **Onboarding** (`/onboarding`) — Middleware detects that the profile has no username and forces this page. User fills in:
   - **Username** — validated against regex, checked for uniqueness on blur.
   - **PSN Online ID** — validated against regex, checked for uniqueness on submit.
   - **Country** — dropdown (default: Kenya).
   - **Bio** — optional, max 280 chars.
   - On submit: profile is updated, user is redirected to `/dashboard`.
6. **Dashboard** (`/dashboard`) — The user's home base. Shows:
   - Welcome message with username.
   - Quick action buttons: "Host Tournament", "1v1 Challenge".
   - Alerts: pending match challenges, actioned reports.
   - Stats grid (from profile aggregate stats).
   - Upcoming matches (next 5, any active status).
   - Active tournaments (up to 6).
   - Recent notifications (last 8).

### Match Flow (Standalone 1v1) — Step by Step

1. **Player A** navigates to `/matches/create`.
2. Fills in the **CreateMatchForm**: opponent (username or PSN), date/time, half length.
3. Client-side Zod validation runs. On pass, `POST /api/matches/create` is called.
4. Server resolves the opponent by querying `profiles` for matching `username` or `psn_online_id`.
5. Server creates the match with `status = 'pending_acceptance'` and calculates time slots.
6. **Player B** sees the pending challenge on their dashboard (amber alert banner: "You have N pending match challenges").
7. Player B opens the match detail page (`/matches/[id]`).
8. **MatchActions component** shows "Accept Challenge" and "Decline" buttons.
   - **Accept** → Updates match status to `scheduled`. Both players see the confirmed match.
   - **Decline** → Updates match status to `cancelled`.
9. At match time, players compete on PlayStation.
10. Back on the platform, each player clicks "Report Score" → enters home and away goals.
    - Player A's report is stored in `home_reported_score_home` / `home_reported_score_away`.
    - Player B's report is stored in `away_reported_score_home` / `away_reported_score_away`.
11. If only one player has reported, the other sees "Waiting for opponent's report".
12. Once both reports are in:
    - **Scores match** → `score_home` and `score_away` are set to the agreed values. `winner_id` is determined (or NULL for a draw). Status → `completed`.
    - **Scores differ** → Status → `disputed`. Both players can now upload evidence screenshots.
13. If disputed, an admin visits `/admin/disputes`, reviews evidence, and sets the final score.

### Tournament Flow — Step by Step

1. **Host** navigates to `/tournaments/create`.
2. Fills in: title, description, mode, size, half length, registration deadline, start time.
3. Tournament is created with `status = 'registration'`.
4. **Players** browse `/tournaments`, see the tournament card with status badge, mode, size, participant count, and start time.
5. Players click into the tournament detail (`/tournaments/[id]`) and click **"Join Tournament"** (JoinLeaveButton). An entry is created in `tournament_participants`.
6. Players can leave before the tournament starts via the same button (now showing "Leave Tournament").
7. When the host is ready (after registration closes, with ≥2 participants), they click **"Start Tournament"** (StartTournamentButton).
8. Server-side (`POST /api/tournaments/[id]/start`):
   - Validates: host is the caller, status is `registration`, ≥2 participants.
   - Shuffles participants randomly → assigns seeds.
   - Generates round-1 bracket using standard seeding pairs.
   - Creates all round-1 match records with time slots.
   - Auto-completes bye matches and advances bye winners.
   - Sets tournament status to `in_progress`.
9. The **BracketView** component renders the bracket with rounds: Round 1, Quarter-Finals, Semi-Finals, Final (labels adapt to tournament size).
10. For each match, both players visit the match and use **ReportScoreForm** to submit scores.
11. If scores agree → match completes, winner advances to the next bracket slot. If the next-round match doesn't exist yet, it's created.
12. If scores disagree → dispute flow (same as standalone, but admin must pick a winner — draws not allowed in tournaments).
13. When the final match is completed, the tournament's `winner_id` is set, status → `completed`.

---

## Authentication & Route Protection

### Supabase Auth Configuration
- **Providers:** Email/password + Google OAuth.
- **Google OAuth callback:** `http://localhost:3000/auth/callback` (configured in `supabase/config.toml`).
- **Email verification:** Enabled. Signup sends a confirmation link.

### Supabase Client Setup
- **Browser client** (`lib/supabase/client.ts`): Uses `createBrowserClient` from `@supabase/ssr`. Typed with `Database` generic for full type safety.
- **Server client** (`lib/supabase/server.ts`): Uses `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`. Manages cookie read/write for SSR.
- **Service client** (`lib/supabase/service.ts`): Uses `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`. For admin operations that bypass RLS. Auto-refresh disabled.
- **Re-export** (`lib/supabase/index.ts`): Re-exports `createClient` from `server.ts` for convenience.

### Middleware (`src/middleware.ts`)

The middleware runs on every request (except static assets) and enforces:

| Rule | Condition | Action |
|---|---|---|
| **Auth redirect** | Logged-in user on `/login`, `/signup`, `/forgot-password` | Redirect → `/dashboard` |
| **Guest redirect** | No user on protected routes | Redirect → `/login?redirect={path}` |
| **Onboarding gate** | Logged-in user with no `username` on any protected route (except `/onboarding`) | Redirect → `/onboarding` |
| **Ban enforcement** | Logged-in user with `is_banned = true` on any protected route (except `/banned`) | Redirect → `/banned` |

**Protected route prefixes:** `/dashboard`, `/onboarding`, `/settings`, `/matches/create`, `/tournaments/create`, `/messages`, `/admin`.

**Matcher:** Excludes `_next/static`, `_next/image`, `favicon.ico`, and all image file extensions from middleware processing.

### OAuth Callback (`/auth/callback`)
- Reads the `code` query parameter from the URL.
- Calls `supabase.auth.exchangeCodeForSession(code)`.
- Validates the `redirect` query parameter with `isSafeRedirect()` (must start with `/`, no `//`, no `:`).
- Redirects to the validated path, defaulting to `/dashboard`.

### Auth Forms

**Login Form (`/login`):**
- Email + password fields.
- "Forgot password?" link.
- "Continue with Google" OAuth button.
- Client-side validation: email format, password ≥ 8 chars.
- On success: `router.push('/dashboard')` + `router.refresh()`.
- Displays error messages from Supabase Auth.

**Signup Form (`/signup`):**
- Email + password + confirm password fields.
- Password match validation.
- "Continue with Google" OAuth button.
- On success: shows "Check your email" confirmation message.
- Email redirect URL: `/auth/callback?redirect=/onboarding`.

**Forgot Password Form (`/forgot-password`):**
- Email field only.
- Sends password reset email via `supabase.auth.resetPasswordForEmail()`.
- Redirect URL: `/settings/profile`.
- Shows success/error feedback.

---

## API Reference

### Tournaments

#### `POST /api/tournaments/[id]/start`
**Auth:** Logged-in user (must be tournament host).

**Validation:**
- Tournament must exist and have `status = 'registration'`.
- Caller must be `host_id`.
- Must have ≥ 2 participants.

**Logic:**
1. Shuffle participants (Fisher-Yates) → assign seeds (1-indexed).
2. Update `tournament_participants` with seeds.
3. Generate round-1 matches via `buildRound1Matches()`.
4. Insert all matches.
5. Auto-advance bye winners: find completed round-1 matches with a winner → create/fill round-2 match slots.
6. Update tournament: `status = 'in_progress'`, `current_round = 1`.

**Response:**
```json
{ "success": true, "matchesCreated": 4 }
```

**Errors:** `403` (not host), `400` (wrong status, too few participants), `500` (server error).

---

#### `POST /api/tournaments/[id]/report`
**Auth:** Logged-in user (must be a player in the match).

**Input:**
```json
{ "matchId": "uuid", "scoreHome": 3, "scoreAway": 1 }
```

**Validation:**
- Match must exist, belong to this tournament, and have status `scheduled` or `in_progress`.
- Caller must be `player_home_id` or `player_away_id`.
- Scores must be non-negative integers.

**Logic:**
1. Determine if caller is home or away.
2. Store reported score in the appropriate columns.
3. If both players have now reported:
   - **Scores match:** Set final score + winner, status → `completed`, call `advanceWinner()`.
   - **Scores differ:** Status → `disputed`, set `dispute_opened_at`.
4. If only one player has reported: status → `in_progress`, wait for other player.

**`advanceWinner()` logic:**
- Compute next round number and bracket position: `Math.ceil(bracketPosition / 2)`.
- Look for an existing match at that position in the next round.
- If found: fill in the empty player slot (home or away).
- If not found: create a new match with the winner in the home slot.

**Responses:**
```json
{ "success": true, "confirmed": true }    // Scores matched
{ "success": true, "disputed": true }     // Scores conflicted
{ "success": true, "waiting": true }      // Waiting for other player
```

---

### Matches

#### `POST /api/matches/create`
**Auth:** Logged-in user.

**Input:**
```json
{ "opponent": "username_or_psn", "scheduled_at": "2026-03-15T18:00:00", "half_length": 6 }
```

**Validation:**
- Opponent must be resolved from `profiles` (by `username` or `psn_online_id`).
- Cannot challenge yourself.

**Logic:**
- Creates match with `match_type = 'standalone'`, `status = 'pending_acceptance'`.
- Calculates `slot_end_at` (scheduled + 30 min) and `no_show_deadline` (scheduled + 10 min).

**Response:**
```json
{ "matchId": "uuid" }
```

---

#### `POST /api/matches/evidence`
**Auth:** Logged-in user.

**Input:** `FormData` with:
- `file`: Image file
- `matchId`: UUID

**Validation:**
- File extension must be in whitelist: `jpg`, `jpeg`, `png`, `webp` (server-side check).
- Max file size: 5 MB.

**Logic:**
1. Generate unique filename: `{matchId}/{uuid}.{ext}`.
2. Upload to Supabase Storage `evidence` bucket.
3. Get public URL.
4. Insert record in `match_evidence`.

**Response:**
```json
{ "success": true }
```

---

### Leaderboards

#### `POST /api/leaderboards/compute`
**Auth:** Bearer token (`CRON_SECRET` env variable) OR logged-in admin.

**Logic:**
1. Fetch all non-banned profiles.
2. Fetch all completed matches.
3. For each profile × each mode (`all`, `1v1`, `2v2`, `pro_clubs`):
   - Filter matches for mode (standalone matches are `all`-mode only; tournament matches map to their tournament mode).
   - Compute: wins, draws, losses, goals for/against, win rate.
   - Fetch tournament data for bonus points.
   - Calculate total points.
4. Sort by points descending → assign ranks.
5. Upsert into `leaderboard_snapshots` (conflict on `user_id, season, mode`).

**Response:**
```json
{ "success": true, "season": "2026-S1", "playersProcessed": 150, "snapshotsCreated": 600 }
```

---

### Messages

#### `POST /api/messages/threads`
**Auth:** Logged-in user.

**Input:**
```json
{ "username": "opponent_name", "message": "Hey, good game!" }
```

**Validation:**
- Recipient must exist (by username).
- Cannot message yourself.
- Cannot message someone who blocked you (or whom you blocked).

**Logic:**
1. Canonicalize user pair: `[userA, userB] = [senderId, recipientId].sort()`.
2. Find or create `dm_threads` with the canonical pair.
3. Insert initial message: `channel_type = 'dm'`, `channel_id = threadId`.
4. Update `dm_threads.last_message_at`.

**Response:**
```json
{ "threadId": "uuid" }
```

---

#### `POST /api/messages/send`
**Auth:** Logged-in user.

**Input:**
```json
{ "threadId": "uuid", "body": "Message text" }
```

**Validation:**
- Body max 2,000 characters.
- Caller must be a participant in the thread.
- Block check: neither user has blocked the other.

**Response:**
```json
{ "messageId": "uuid" }
```

---

### Reports

#### `POST /api/reports/create`
**Auth:** Logged-in user.

**Input:**
```json
{
  "reported_user_id": "uuid",
  "reason": "cheating",
  "details": "Used lag switch during our match",
  "context_type": "match",
  "context_id": "match-uuid"
}
```

**Validation:**
- Cannot report yourself.
- Reason must be one of: `cheating`, `harassment`, `impersonation`, `spam`, `other`.
- No duplicate open report (same reporter → same reported_user).
- Details max 1,000 chars.

**Response:**
```json
{ "success": true }
```

---

### Admin

#### `PATCH /api/admin/reports/[id]`
**Auth:** Admin only.

**Input:**
```json
{ "status": "actioned", "admin_notes": "Banned for 7 days for cheating" }
```

**Logic:** Updates report, sets `resolved_by` to admin user. Creates audit log entry.

---

#### `PATCH /api/admin/disputes/[id]`
**Auth:** Admin only.

**Input:**
```json
{ "score_home": 3, "score_away": 1, "winner_id": "uuid" }
```

**Validation:**
- Match must have `status = 'disputed'`.
- For tournament matches: `winner_id` is required (no draws allowed).

**Logic:**
1. Set final scores and winner. Status → `completed`.
2. Set `dispute_resolved_at` and `dispute_resolved_by`.
3. If tournament match: call `advanceWinner()`.
4. Create audit log entry.

---

#### `PATCH /api/admin/users/[id]`
**Auth:** Admin only.

**Input:**
```json
{ "action": "ban" }
```
Actions: `ban`, `unban`, `promote`, `demote`.

**Validation:** Cannot modify your own account.

**Logic:** Updates `is_banned` or `is_admin` on profile. Creates audit log entry.

---

### PSN

#### `GET /api/psn/lookup/[onlineId]`
**Auth:** Logged-in user.

**Status:** Feature-flagged (`feature_flags.psn_lookup_enabled`). Returns 503 if disabled.

**Current state:** Placeholder/stub response. Integration with `psn-api` library is planned.

---

## Database Schema

### Tables in Detail

#### `profiles`
```sql
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
username text UNIQUE                        -- 3-20 chars, ^[a-zA-Z0-9_]{3,20}$
psn_online_id text UNIQUE                   -- starts with letter, 3-16 chars
avatar_url text
bio text                                    -- max 280 chars (CHECK constraint)
country text NOT NULL DEFAULT 'KE'
timezone text NOT NULL DEFAULT 'Africa/Nairobi'
is_admin boolean NOT NULL DEFAULT false
is_banned boolean NOT NULL DEFAULT false
psn_data jsonb                              -- PSN profile data cache
psn_data_fetched_at timestamptz
stats_matches_played int NOT NULL DEFAULT 0
stats_matches_won int NOT NULL DEFAULT 0
stats_tournaments_played int NOT NULL DEFAULT 0
stats_tournaments_won int NOT NULL DEFAULT 0
stats_goals_for int NOT NULL DEFAULT 0
stats_goals_against int NOT NULL DEFAULT 0
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()  -- auto-updated via trigger
```
**Indexes:** `username`, `psn_online_id`.

#### `tournaments`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
host_id uuid NOT NULL REFERENCES profiles(id)
title text NOT NULL                         -- 3-100 chars
description text                            -- max 1000 chars
game text NOT NULL DEFAULT 'FC26'
mode text NOT NULL                          -- '1v1', '2v2', 'pro_clubs'
size int NOT NULL                           -- 2, 4, 8, 16, 32
format text NOT NULL DEFAULT 'single_elimination'
rules_half_length_min int NOT NULL DEFAULT 6
status text NOT NULL DEFAULT 'registration' -- registration, in_progress, completed, cancelled
current_round int NOT NULL DEFAULT 0
registration_closes_at timestamptz NOT NULL
starts_at timestamptz NOT NULL
ended_at timestamptz
winner_id uuid REFERENCES profiles(id)
banner_url text
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()  -- auto-updated via trigger
```
**Indexes:** `status`, `starts_at`, `host_id`.

#### `tournament_participants`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
user_id uuid NOT NULL REFERENCES profiles(id)
seed int                                    -- assigned when tournament starts
status text NOT NULL DEFAULT 'registered'   -- registered, checked_in, eliminated, winner
joined_at timestamptz NOT NULL DEFAULT now()
UNIQUE(tournament_id, user_id)
```

#### `matches`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
match_type text NOT NULL                    -- 'tournament' or 'standalone'
tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE
round int
bracket_position int
player_home_id uuid REFERENCES profiles(id)
player_away_id uuid REFERENCES profiles(id)
status text NOT NULL DEFAULT 'scheduled'    -- 7 possible states (see lifecycle above)
scheduled_at timestamptz NOT NULL
slot_end_at timestamptz NOT NULL
no_show_deadline timestamptz NOT NULL
score_home int                              -- final confirmed score
score_away int
home_reported_score_home int                -- home player's report
home_reported_score_away int
away_reported_score_home int                -- away player's report
away_reported_score_away int
winner_id uuid REFERENCES profiles(id)
result_confirmed_at timestamptz
dispute_opened_at timestamptz
dispute_resolved_at timestamptz
dispute_resolved_by uuid REFERENCES profiles(id)
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()  -- auto-updated via trigger
```
**Indexes:** `tournament_id`, `status`, `scheduled_at`, `player_home_id`, `player_away_id`, `match_type`.
**Constraints:**
- `chk_standalone_no_tournament`: standalone matches must NOT have a tournament_id.
- `chk_tournament_has_id`: tournament matches MUST have a tournament_id.

#### `match_evidence`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE
uploaded_by uuid NOT NULL REFERENCES profiles(id)
image_path text NOT NULL
image_url text NOT NULL
uploaded_at timestamptz NOT NULL DEFAULT now()
UNIQUE(match_id, uploaded_by)               -- one evidence per player per match
```

#### `messages`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
channel_type text NOT NULL                  -- 'tournament', 'match', 'dm'
channel_id text NOT NULL
sender_id uuid NOT NULL REFERENCES profiles(id)
body text NOT NULL                          -- max 2000 chars
is_deleted boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```
**Indexes:** Composite `(channel_type, channel_id, created_at DESC)`, `sender_id`.

#### `dm_threads`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_a_id uuid NOT NULL REFERENCES profiles(id)
user_b_id uuid NOT NULL REFERENCES profiles(id)
last_message_at timestamptz
created_at timestamptz NOT NULL DEFAULT now()
UNIQUE(user_a_id, user_b_id)
CHECK (user_a_id < user_b_id)              -- canonical ordering prevents duplicates
```

#### `reports`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
reporter_id uuid NOT NULL REFERENCES profiles(id)
reported_user_id uuid NOT NULL REFERENCES profiles(id)
reason text NOT NULL                        -- cheating, harassment, impersonation, spam, other
details text                                -- max 1000 chars
context_type text
context_id uuid
status text NOT NULL DEFAULT 'open'         -- open, reviewed, actioned, dismissed
admin_notes text
resolved_by uuid REFERENCES profiles(id)
created_at timestamptz NOT NULL DEFAULT now()
```

#### `blocks`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
blocker_id uuid NOT NULL REFERENCES profiles(id)
blocked_id uuid NOT NULL REFERENCES profiles(id)
created_at timestamptz NOT NULL DEFAULT now()
UNIQUE(blocker_id, blocked_id)
```

#### `notifications`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
type text NOT NULL
title text NOT NULL
body text
data jsonb
is_read boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```
**Index:** `(user_id, is_read, created_at DESC)` — optimized for "unread notifications" query.

#### `leaderboard_snapshots`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid NOT NULL REFERENCES profiles(id)
season text NOT NULL
mode text NOT NULL
matches_played int NOT NULL DEFAULT 0
matches_won int NOT NULL DEFAULT 0
win_rate numeric(5,4) NOT NULL DEFAULT 0    -- e.g., 0.7500 = 75%
goals_for int NOT NULL DEFAULT 0
goals_against int NOT NULL DEFAULT 0
goal_diff int NOT NULL DEFAULT 0
tournaments_won int NOT NULL DEFAULT 0
points int NOT NULL DEFAULT 0
rank int
computed_at timestamptz NOT NULL DEFAULT now()
```
**Indexes:** `(season, mode, rank)` for sorted queries. `UNIQUE (user_id, season, mode)` for upsert support.

#### `audit_logs`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
actor_id uuid REFERENCES profiles(id)
action text NOT NULL
target_type text NOT NULL
target_id uuid NOT NULL
metadata jsonb
created_at timestamptz NOT NULL DEFAULT now()
```
**Indexes:** `actor_id`, `(target_type, target_id)`.

#### `feature_flags`
```sql
key text PRIMARY KEY
enabled boolean NOT NULL DEFAULT false
metadata jsonb
updated_at timestamptz NOT NULL DEFAULT now()
```
**Seed data:** `psn_lookup_enabled` (false), `beta_mode` (false), `maintenance_mode` (false).

### Database Triggers

| Trigger | Table | Event | Function | Purpose |
|---|---|---|---|---|
| `set_profiles_updated_at` | profiles | BEFORE UPDATE | `handle_updated_at()` | Auto-set `updated_at = now()` |
| `set_tournaments_updated_at` | tournaments | BEFORE UPDATE | `handle_updated_at()` | Auto-set `updated_at = now()` |
| `set_matches_updated_at` | matches | BEFORE UPDATE | `handle_updated_at()` | Auto-set `updated_at = now()` |
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` | Auto-create bare `profiles` row |

---

## Row Level Security (RLS) Policies

RLS is enabled on **every** public table. Below is the full policy map:

### `profiles`
| Policy | Operation | Rule |
|---|---|---|
| `profiles_select_public` | SELECT | Anyone can read all profiles |
| `profiles_insert_own` | INSERT | Can only insert your own (`auth.uid() = id`) |
| `profiles_update_own` | UPDATE | Can only update your own, and only if not banned |

### `tournaments`
| Policy | Operation | Rule |
|---|---|---|
| `tournaments_select_public` | SELECT | Anyone can read all tournaments |
| `tournaments_insert_auth` | INSERT | Must be host, must not be banned |
| `tournaments_update_host` | UPDATE | Only host can update |
| `tournaments_update_admin` | UPDATE | Admins can update any tournament |

### `tournament_participants`
| Policy | Operation | Rule |
|---|---|---|
| `tp_select_public` | SELECT | Anyone can read |
| `tp_insert_own` | INSERT | Can only join as yourself |
| `tp_delete_own` | DELETE | Can only remove yourself |

### `matches`
| Policy | Operation | Rule |
|---|---|---|
| `matches_select` | SELECT | Tournament matches: public. Standalone: only participants or admins |
| `matches_insert_auth` | INSERT | Any authenticated user |
| `matches_update_players` | UPDATE | Only home or away player |
| `matches_update_admin` | UPDATE | Admins can update any match |

### `match_evidence`
| Policy | Operation | Rule |
|---|---|---|
| `evidence_select` | SELECT | Only match participants or admins |
| `evidence_insert` | INSERT | Only match participants, for their own uploads |

### `messages`
| Policy | Operation | Rule |
|---|---|---|
| `messages_select_auth` | SELECT | Any auth user (non-deleted only) |
| `messages_insert_auth` | INSERT | Own messages only, not banned |
| `messages_update_admin` | UPDATE | Admins only (for soft-delete) |

### `dm_threads`
| Policy | Operation | Rule |
|---|---|---|
| `dm_threads_select_own` | SELECT | Only thread participants |
| `dm_threads_insert_own` | INSERT | Only if you're one of the two users |

### `reports`
| Policy | Operation | Rule |
|---|---|---|
| `reports_insert_auth` | INSERT | Own reports only (reporter = self) |
| `reports_select_own` | SELECT | Own reports or admin |
| `reports_update_admin` | UPDATE | Admins only |

### `blocks`
| Policy | Operation | Rule |
|---|---|---|
| `blocks_select_own` | SELECT | Only your own blocks |
| `blocks_insert_own` | INSERT | Only as blocker |
| `blocks_delete_own` | DELETE | Only your own blocks |

### `notifications`
| Policy | Operation | Rule |
|---|---|---|
| `notifications_select_own` | SELECT | Own notifications only |
| `notifications_update_own` | UPDATE | Own notifications only (for marking read) |
| `notifications_insert_system` | INSERT | Open (for system/trigger inserts) |

### `leaderboard_snapshots`
| Policy | Operation | Rule |
|---|---|---|
| `leaderboard_select_public` | SELECT | Anyone can read |
| (no insert/update policy) | INSERT/UPDATE | Service role only (compute API) |

### `audit_logs`
| Policy | Operation | Rule |
|---|---|---|
| `audit_select_admin` | SELECT | Admins only |
| `audit_insert_system` | INSERT | Open (for system inserts) |

### `feature_flags`
| Policy | Operation | Rule |
|---|---|---|
| `feature_flags_select_public` | SELECT | Anyone can read |
| `feature_flags_update_admin` | UPDATE | Admins only |

---

## Storage Buckets

### `avatars` Bucket
- **Access:** Public read (anyone can view avatar URLs).
- **Upload:** Authenticated users only, to their own folder (`{user_id}/*`).
- **Max file size:** 2 MB.
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- **Policies:**
  - Public SELECT on all objects.
  - Authenticated INSERT into `{uid}/*`.
  - Authenticated UPDATE and DELETE on own objects.

### `evidence` Bucket
- **Access:** Private (authenticated read only).
- **Upload:** Authenticated users only, to their own folder (`{user_id}/*`).
- **Max file size:** 5 MB.
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`.
- **Policies:**
  - Authenticated SELECT.
  - Authenticated INSERT into `{uid}/*`.

---

## Design System

### Colors (Tailwind Custom Theme)

| Token | Role | Value |
|---|---|---|
| `brand` | Primary CTA, buttons, links, active states | `#2563EB` (blue-600) |
| `brand-600` | Hover state for brand | Darker blue |
| `brand-100` | Subtle brand background | Light blue |
| `accent` | Wins, positive actions, success | `#22C55E` (green-500) |
| `surface-50` | Light page background | Near-white |
| `surface-100` | Card/message backgrounds | Light gray |
| `surface-200` | Borders | Light gray |
| `surface-300` | Heavier borders | Medium gray |
| `ink` | Primary text | Dark gray/near-black |
| `ink-muted` | Secondary text | Medium gray |
| `ink-light` | Tertiary text | Light gray |

**Semantic colors (Tailwind defaults used for):**
- **Red** (`text-red-600`, `bg-red-100`) — Errors, danger actions, losses, bans.
- **Amber** (`text-amber-700`, `bg-amber-50/100`) — Warnings, pending states, in-progress, top-3 highlight.
- **Green** (via `accent` or `text-green-*`) — Wins, success, completed.
- **Blue** (via `brand`) — Primary actions, links, registration status.
- **Gray** (via `surface-*`) — Neutral, cancelled, dismissed.

### Typography

| Element | Font | Weight | Tailwind Class |
|---|---|---|---|
| Headings | Space Grotesk | 500–700 | `font-heading`, `font-bold` |
| Body text | Inter | 400–600 | `font-body` (default) |
| Labels | Inter | 500 | `text-sm font-medium` |
| Small text | Inter | 400 | `text-xs` |
| Muted text | Inter | 400 | `text-ink-muted` |

**Google Fonts loaded:** Inter (400, 500, 600, 700), Space Grotesk (500, 600, 700).

### Layout

- **Container:** `.container-app` — `max-width: 80rem (7xl)`, with responsive horizontal padding: `px-4 sm:px-6 lg:px-8`.
- **Card pattern:** `rounded-xl border border-surface-200 bg-white p-6`, with `hover:shadow-md` for interactive cards.
- **Section spacing:** `py-8` for page sections, `py-20` for homepage sections.
- **Gap sizes:** `gap-3` to `gap-8` for grids and flex layouts.
- **Border radius:** `0.5rem` (8px) default, `rounded-lg` or `rounded-xl` for larger cards.

### Responsive Grid Patterns

| Context | Mobile | `sm:` (640px+) | `md:` (768px+) | `lg:` (1024px+) |
|---|---|---|---|---|
| Tournament cards | 1 col | 2 cols | 2 cols | 3 cols |
| Feature cards | 1 col | 2 cols | 2 cols | 3 cols |
| Stats grid | 2 cols | 3 cols | 4 cols | 5 cols |
| Participant list | 1 col | 2 cols | 2 cols | 4 cols |

### Status Badge Colors

| Status | Color | Context |
|---|---|---|
| Registration | Blue (`bg-blue-100 text-blue-700`) | Tournaments |
| In Progress | Amber (`bg-amber-100 text-amber-700`) | Tournaments, Matches |
| Completed | Green (`bg-green-100 text-green-700`) | Tournaments, Matches |
| Cancelled | Gray (`bg-gray-100 text-gray-600`) | Tournaments, Matches |
| Pending Acceptance | Amber | Matches |
| Disputed | Red (`bg-red-100 text-red-700`) | Matches |
| No Show | Gray | Matches |

### Button Patterns
- **Primary:** `bg-brand text-white rounded-xl px-8 py-3.5 font-semibold shadow-lg shadow-brand/25 hover:bg-brand-600`.
- **Secondary:** `border border-surface-300 bg-white text-ink rounded-xl px-8 py-3.5 font-semibold shadow-sm hover:bg-surface-50`.
- **Danger:** `text-red-600 border-red-200 hover:bg-red-50`.
- **Disabled:** `opacity-60` + `disabled` attribute.

---

## Components Reference

### Layout Components

#### `Header` — Sticky top navigation bar
- Server component that fetches the current user profile.
- **Desktop:** Logo (links to `/`), nav links (Tournaments, Leaderboards), and UserNav or Login/Signup buttons.
- **Mobile:** Logo + MobileMenu hamburger.
- Styled: `sticky top-0 z-50 backdrop-blur bg-white/90 border-b`.

#### `Footer` — Platform footer
- Three-column grid: Brand info, platform links, legal/disclaimer.
- Stacked on mobile.

#### `UserNav` — Authenticated user dropdown
- Shows avatar (or initials if no avatar) + chevron.
- **Dropdown menu items:** My Profile, Settings, Dashboard, Messages, Admin Panel (admin only), Sign Out.
- Click-outside detection to close menu.
- Sign out via `supabase.auth.signOut()` + redirect to `/`.

#### `MobileMenu` — Mobile hamburger navigation
- Hamburger icon button (hidden on desktop).
- Slide-out menu panel with backdrop overlay.
- Nav links: Tournaments, Leaderboards, Dashboard, Messages (if logged in), Login/Signup (if guest).

### Tournament Components

#### `BracketView` — Tournament bracket visualization
- Groups matches by `round` number.
- Horizontal scrollable layout (each round is a vertical column).
- Round labels adapt to tournament size: "Round 1", "Quarter-Finals", "Semi-Finals", "Final".
- Each match card shows: home player vs away player, scores (if completed), winner highlighted with accent background.
- "BYE" placeholder if a player slot is null.
- Uses `tabular-nums` font variant for score alignment.

#### `JoinLeaveButton` — Join or leave a tournament
- Conditional rendering based on whether user is already a participant.
- **Join:** `bg-brand` button → inserts into `tournament_participants`.
- **Leave:** Red-bordered button → deletes from `tournament_participants`.
- Refreshes the page on success.

#### `StartTournamentButton` — Host-only tournament start
- Only visible to the tournament host when status is `registration`.
- Confirmation dialog before starting.
- Calls `POST /api/tournaments/[id]/start`.
- Loading spinner during request.

#### `ParticipantList` — Registered participants grid
- Responsive grid: 1 col → 2 → 4 cols.
- Each card: avatar, username, PSN ID, seed number (if assigned).

#### `TournamentStatusBadge` — Color-coded status pill
- Registration: blue, In Progress: amber, Completed: green, Cancelled: gray.
- Small pill shape with colored background and text.

#### `ReportScoreForm` — Tournament match score input
- Two number inputs: Home score and Away score (range 0–99).
- Submit button with loading state.
- Success/error message display.

### Match Components

#### `CreateMatchForm` — 1v1 challenge creation
- Fields: opponent (text), scheduled date/time (datetime-local), half length (number 4–10, default 6).
- Client-side Zod validation.
- On submit: `POST /api/matches/create` → redirect to match detail.

#### `MatchActions` — Context-aware match action buttons
- **Away player + pending_acceptance:** "Accept Challenge" (green) + "Decline" (red).
- **Home player + pending_acceptance:** "Waiting for response..." + "Cancel Match".
- **Any player + scheduled/in_progress:** "Report Score" (toggles inline form) + "Cancel Match".
- **Report score form (inline):** Home score + Away score inputs, Submit + Cancel buttons.
- For tournament matches: calls tournament report API.
- For standalone matches: dual-report system (stores in `home_reported_*` or `away_reported_*` columns).

#### `EvidenceUpload` — Screenshot upload for dispute evidence
- File input accepting image types.
- Client-side size validation (5 MB max).
- Sends `FormData` to `POST /api/matches/evidence`.
- Reloads page on success to show uploaded image.

### Leaderboard Components

#### `LeaderboardTable` — Ranked player table
- Responsive table with columns: Rank, Player, Points, Played, Won, Win%, GF, GA, GD, Tournament Wins.
- Rank badges: 🥇 (1st), 🥈 (2nd), 🥉 (3rd), #N (others).
- Top 3 rows have `bg-amber-50` background highlight.
- Player name links to `/profile/[username]`.
- Some columns hidden on mobile for readability.

#### `ModeFilter` — Leaderboard mode selector
- Pill button group: **Overall** (`all`), **1v1**, **2v2**, **Pro Clubs** (`pro_clubs`).
- Active pill: white background, brand text.
- Each pill is a link with `?mode=` query param.

### Message Components

#### `ChatWindow` — Real-time chat interface
- **Real-time:** Subscribes to Supabase Realtime channel for `INSERT` events on `messages` table.
- **Initial load:** Fetches last 100 messages.
- **Message bubbles:** Sender's messages (brand blue, right-side, `rounded-br-sm`), other's messages (gray, left-side, `rounded-bl-sm`).
- **Timestamps:** Displayed in `Africa/Nairobi` timezone.
- **Input:** Text field (max 2000 chars), send button (disabled if empty or loading).
- **Auto-scroll:** Scrolls to bottom on new message.
- **Header:** Back link + other user's profile link.

#### `NewThreadForm` — Start a new DM conversation
- Recipient username input.
- Message textarea.
- POST to `/api/messages/threads` → redirect to thread detail.

### Shared Components

#### `ProfileHeader` — Player identity display
- Large avatar image (with initials fallback via `getInitials()`).
- Username, PSN ID in a badge, country, bio.
- "Edit Profile" link (only visible on own profile).

#### `PlayerStatsPanel` — Full stats dashboard
- **Top banner:** Total points + rank, recent form (last 5 results as colored W/L/D badges).
- **Stats grid** (responsive 2→4→5 cols):
  - Played, Won (green), Lost (red), Drawn
  - Win%, Goals For, Goals Against, Goal Diff (colored ±)
  - Avg Goals/Match, Clean Sheets
  - Tournaments Played, Tournament Wins (green)
  - Current Streak (with W/L/D indicator), Best Win Streak (green)

#### `StatsGrid` — Compact profile stats
- 4-column grid displaying aggregate profile stats: Matches, Wins, Win%, Goals For/Against, Goal Diff, Tournaments Played, Tournament Wins.

#### `ReportUserButton` — Report modal trigger
- Text link "Report" → opens modal overlay.
- Modal: reason dropdown, details textarea, submit button.
- Success message (green), error alert (red).
- Can be closed.

### Admin Components

#### `UserManagementTable` — Searchable user admin
- Search bar (username or PSN ID).
- Filter buttons: All, Banned, Admins.
- Paginated table (20/page): avatar, username, joined date, PSN ID, match count, status badges.
- Row actions: Ban/Unban, Promote/Demote (PATCH calls with loading states).
- Self-modification prevented.

#### `DisputeList` — Dispute resolution interface
- **Active section:** Each disputed match shows both players' reported scores side by side + admin score input form.
- **Resolved section:** List of recently resolved disputes with resolver name and timestamp.
- Confirmation dialog before resolving.
- Score validation before submit.

#### `ReportsList` — Tabbed report management
- Status tabs with counts: Open (red badge), Reviewed (blue), Actioned (green), Dismissed (gray), All.
- Each report: reason badge, status badge, reporter + reported user (avatars + profile links), details, context link.
- Admin actions: textarea for notes + status buttons (Action/Review/Dismiss).
- Empty state for tabs with no reports.

---

## Utility Libraries

### `lib/utils.ts`
```typescript
cn(...inputs)                // Merges class names with clsx + tailwind-merge (avoids conflicts)
formatDate(date, opts?)      // Formats to "Jan 03, 2026" in Africa/Nairobi timezone
formatTime(date)             // Formats to "14:23" in Africa/Nairobi timezone
formatDateTime(date)         // Combines formatDate + formatTime: "Jan 03, 2026 14:23"
getInitials(name)            // Extracts initials: "Clutch Nation" → "CN"
isSafeRedirect(path)         // Validates redirect paths: starts with /, no //, no : (prevents open redirect)
```

### `lib/stats.ts`
```typescript
computePlayerStats(userId, matches[], tournamentsPlayed, tournamentsWon, rank)
// Full stats computation from match history:
// - Iterates completed matches sorted by date
// - Determines home/away context per match
// - Accumulates W/L/D, goals, clean sheets
// - Computes current streak and best win streak
// - Calculates points from wins, draws, and tournament placements
// - Returns PlayerDetailedStats object

getCurrentSeason()           // Returns CURRENT_SEASON constant ("2026-S1")
```

### `lib/tournament.ts`
```typescript
shuffle<T>(arr)              // Fisher-Yates shuffle for random seeding
totalRounds(size)            // Math.ceil(Math.log2(size)) — rounds needed for bracket
generateBracketPairs(size)   // Standard seeding pairs: [homeIdx, awayIdx][]
                             // For size 8: [[0,7],[3,4],[1,6],[2,5]] (1v8, 4v5, 2v7, 3v6)
generateMatchTimes(roundStart, matchCount)
                             // Returns {scheduledAt, slotEndAt, noShowDeadline}[]
                             // Spaced by SLOT_DURATION_MIN (30 min)
buildRound1Matches(tournamentId, seededPlayerIds[], startsAt)
                             // Full round-1 match array ready for DB insert
                             // Handles bye auto-completion (winner set to present player)
```

### `lib/admin.ts`
```typescript
requireAdmin()               // For server components: checks is_admin, redirects if not
                             // Returns { supabase, userId }
checkAdminApi()              // For API routes: returns null if not admin
                             // Returns { supabase, userId } | null
```

---

## Constants & Configuration

All platform constants are defined in `lib/constants.ts`:

### Game & Modes
```
GAME = 'FC26'
MODES = ['1v1', '2v2', 'pro_clubs']
TOURNAMENT_SIZES = [2, 4, 8, 16, 32]
```

### Status Enums
```
TOURNAMENT_STATUSES = ['registration', 'in_progress', 'completed', 'cancelled']
MATCH_STATUSES = ['pending_acceptance', 'scheduled', 'in_progress', 'completed', 'disputed', 'cancelled', 'no_show']
MATCH_TYPES = ['tournament', 'standalone']
REPORT_REASONS = ['cheating', 'harassment', 'impersonation', 'spam', 'other']
LEADERBOARD_MODES = ['all', '1v1', '2v2', 'pro_clubs']
```

### Timings
```
HALF_LENGTH_MIN = 6               // Default half length (minutes)
SLOT_DURATION_MIN = 30            // Duration of each match slot (minutes)
NO_SHOW_DEADLINE_MIN = 10         // No-show deadline after slot start (minutes)
DISPUTE_SLA_MIN = 15              // Target time for dispute resolution (minutes)
TIMEZONE = 'Africa/Nairobi'       // All dates displayed in this timezone
```

### Validation Rules
```
USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
PSN_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/
MIN_PASSWORD_LENGTH = 8
MAX_AVATAR_SIZE_MB = 2
MAX_EVIDENCE_SIZE_MB = 5
ALLOWED_EVIDENCE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
```

### Points System
```
MATCH_WIN = 3
MATCH_DRAW = 1
MATCH_LOSS = 0
TOURNAMENT_WIN = 25
TOURNAMENT_RUNNER_UP = 12
TOURNAMENT_SEMIFINAL = 6
TOURNAMENT_PARTICIPATION = 2
```

### Seasons
```
CURRENT_SEASON = '2026-S1'
```

### Supported Countries
```
KE (Kenya), TZ (Tanzania), UG (Uganda), NG (Nigeria), ZA (South Africa), GH (Ghana), OTHER
```

### Feature Flags
```
psn_lookup_enabled = false        // PSN API integration toggle
beta_mode = false                 // Beta feature gate
maintenance_mode = false          // Maintenance mode toggle
```

---

## Security & Validation

### Input Validation Layers

1. **Client-side (forms):**
   - Zod schemas for structured validation (e.g., `CreateMatchForm`).
   - Regex validation for username and PSN ID.
   - Password minimum length check.
   - File size check before upload.

2. **Server-side (API routes):**
   - All inputs are re-validated (never trust client).
   - Enum values checked against allowed lists.
   - File extensions checked against server-side whitelist.
   - Length limits enforced.
   - Self-operation prevention (can't challenge/report/ban yourself).
   - Duplicate prevention (unique constraints + explicit checks).

3. **Database-level:**
   - CHECK constraints on enums (mode, status, reason).
   - CHECK constraints on text lengths (bio ≤ 280, title 3–100, etc.).
   - UNIQUE constraints (username, PSN ID, tournament_participant pairs, evidence per player).
   - Foreign key constraints with ON DELETE CASCADE where appropriate.
   - RLS policies as final authorization layer.

### Authentication Security
- Supabase Auth manages sessions, tokens, and password hashing.
- SSR cookie handling via `@supabase/ssr` — no client-exposed tokens.
- Middleware enforces auth on protected routes before any data loads.
- Admin checks are server-side (both page-level and API-level).
- OAuth callback validates redirect URLs with `isSafeRedirect()` to prevent open redirect attacks.

### Authorization Model
- **RLS** is the primary authorization mechanism — even if application code has a bug, the database won't return unauthorized data.
- Admin operations use a two-layer check: API route validates admin status via `checkAdminApi()`, AND the Supabase client inherits the user's RLS context.
- Service-role client (`createServiceClient()`) bypasses RLS — used only for system operations (leaderboard compute).

### Data Integrity
- `updated_at` triggers ensure timestamps are always current.
- Auto-profile creation trigger ensures every auth user has a profile row.
- Canonical DM thread ordering (`user_a_id < user_b_id`) prevents duplicate threads.
- Match type constraints ensure standalone matches can't reference tournaments and vice versa.
- Leaderboard upsert (unique index on `user_id, season, mode`) prevents duplicate snapshots.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Kenya-first localization** | Default timezone `Africa/Nairobi`, default country `KE`, supported countries are East/West African nations. Built for the local FC26 PlayStation community. |
| **Evidence-based fair play** | Every disputed match can be backed by uploaded screenshots, reviewed by admins with a full audit trail. Builds trust in the competitive ecosystem. |
| **Dual score reporting** | Both players independently report scores. Prevents unilateral fabrication — both must agree, or the dispute system kicks in. |
| **Single elimination only (MVP)** | Keeps bracket logic simple and predictable. Swiss, double elimination, and round-robin can be added later. |
| **Seasonal leaderboards** | Rankings reset per season, keeping competition fresh and giving new players a realistic path to the top. |
| **Auto-profile creation** | Database trigger on `auth.users` insert ensures every user immediately has a profile row, simplifying all downstream queries and data fetching. |
| **Middleware-driven routing** | Authentication, onboarding completion, and ban enforcement are all handled at the middleware level — before any page component renders. This centralizes access control. |
| **RLS as primary authz** | Row Level Security on every table means even application bugs can't expose unauthorized data. Defense in depth. |
| **Server components by default** | Next.js App Router server components for data fetching, with `'use client'` only where interactivity (forms, subscriptions, dropdowns) is needed. Minimizes client JS. |
| **Supabase Realtime for chat** | Real-time messaging without building a custom WebSocket server. Supabase handles connection management, scaling, and filtering. |
| **Canonical DM thread ordering** | `CHECK (user_a_id < user_b_id)` prevents duplicate DM threads between the same two users, regardless of who initiates. |
| **Upsert for leaderboards** | Using unique constraint + `ON CONFLICT` for leaderboard snapshots prevents data loss during recomputation (vs. delete-then-insert). |
| **Feature flags** | Runtime toggle for PSN integration, beta features, and maintenance mode without code deploys. |
