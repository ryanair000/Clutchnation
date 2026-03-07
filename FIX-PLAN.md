# ClutchNation — Post-Review Fix Plan

## Phase A: Critical Security & Logic Fixes
> **Priority:** BLOCKER — must fix before any real users

| # | Fix | File(s) | Description |
|---|-----|---------|-------------|
| A1 | Open redirect in auth | login-form, signup-form, callback/route | Validate redirect URLs against whitelist — only allow relative paths starting with `/` |
| A2 | Tournament score auth | api/tournaments/[id]/report/route.ts | Add check that reporting user is actually player_home or player_away |
| A3 | Dispute → advance winner | api/admin/disputes/[id]/route.ts | After resolving dispute, call advanceWinner() to fill next-round match |
| A4 | Disallow knockout draws | api/admin/disputes/[id]/route.ts | Return 400 if resolved scores are equal and no explicit winner chosen |
| A5 | Bye match advancement | lib/tournament.ts, api/tournaments/[id]/start/route.ts | After creating bye matches, auto-advance winners to next round |
| A6 | Leaderboard upsert | api/leaderboards/compute/route.ts | Replace delete+insert with upsert to prevent data loss on partial failure |
| A7 | Evidence file validation | api/matches/evidence/route.ts | Whitelist allowed extensions (jpg, jpeg, png, webp) on server side |
| A8 | Password min length | constants.ts, login-form, signup-form | Increase minimum password to 8 characters |

## Phase B: Mobile Navigation & Core UX
> **Priority:** HIGH — 80% of Kenya users are mobile

| # | Fix | File(s) | Description |
|---|-----|---------|-------------|
| B1 | Mobile hamburger menu | components/layout/header.tsx | Add responsive mobile menu with slide-out navigation |
| B2 | Bracket mobile layout | components/tournaments/bracket-view.tsx | Vertical stacked layout on mobile instead of horizontal scroll |
| B3 | Homepage caching | app/page.tsx | Add `export const revalidate = 3600` for ISR |
| B4 | Evidence upload no reload | components/matches/evidence-upload.tsx | Replace window.location.reload() with state update + router.refresh() |
| B5 | Score form mobile fix | components/matches/match-actions.tsx | Stack score inputs vertically on small screens |
| B6 | Chat timestamps + dates | components/messages/chat-window.tsx | Show date headers between messages from different days |

## Phase C: Pagination & Performance
> **Priority:** HIGH — breaks at scale

| # | Fix | File(s) | Description |
|---|-----|---------|-------------|
| C1 | Leaderboard pagination | app/leaderboards/page.tsx, leaderboard-table.tsx | Add offset-based pagination (25 per page) |
| C2 | Tournament list pagination | app/tournaments/page.tsx | Add Load More / pagination for tournaments |
| C3 | Chat message pagination | components/messages/chat-window.tsx | Load last 50 messages, "Load older" button |
| C4 | Middleware caching | middleware.ts | Skip profile fetch for static assets; add lightweight caching |
| C5 | Use next/image | Multiple components | Replace raw `<img>` with Next.js `<Image>` for auto-optimization |

## Phase D: Missing Features
> **Priority:** MEDIUM — expected by users

| # | Fix | File(s) | Description |
|---|-----|---------|-------------|
| D1 | Duplicate match prevention | api/matches/create/route.ts | Check for existing pending/scheduled match between same players |
| D2 | Standalone match mode | matches schema + create form + API | Add `mode` column to matches for standalone filtering |
| D3 | Form state persistence | create-tournament-form, edit-profile-form | Auto-save drafts to localStorage |
| D4 | Confirmation dialogs | join-leave-button, match-actions, start-tournament | Add custom confirm modals for destructive actions |
| D5 | Report modal close (X) | report-user-button.tsx | Add X close button, backdrop click close, Escape key |

## Phase E: Accessibility & Final Polish
> **Priority:** MEDIUM — compliance & quality

| # | Fix | File(s) | Description |
|---|-----|---------|-------------|
| E1 | Image alt texts | All avatar images | Proper alt text using username |
| E2 | Focus indicators | globals.css | Add visible focus-visible ring styles |
| E3 | Modal accessibility | report-user-button.tsx | role="dialog", aria-modal, focus trap |
| E4 | Keyboard nav (UserNav) | user-nav.tsx | Escape to close, fix duplicate event listeners |
| E5 | ARIA labels | header, chat-window, match-actions | Label icon buttons and nav links |
