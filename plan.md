# Daily Goals Tracker — Project Plan

## 1. Concept

A multi-user site where each person maintains a **Daily Goals** list of tasks.
Each task is worth a number of **points**, and tasks can optionally be
**repeatable/counted items** (e.g. "Solve LeetCode problems" ×5 renders as 5
individual checkboxes, one point-fraction each). Every user's daily
completion rolls up into a **daily grade** (percentage of points earned),
shown on a shared calendar so everyone can see everyone else's goals,
points, and history.

---

## 2. Core Features

### 2.1 Daily Goals Tab
- Add a task/goal with:
  - Title (e.g. "Solve LeetCode problems")
  - Points value (total points the task is worth)
  - Type: **Simple** (one checkbox) or **Counted** (N sub-checks)
    - If Counted, specify `count` (e.g. 5) → generates 5 checkboxes
    - Points are split evenly across sub-checks (or weighted, configurable)
  - Optional: category/tag, recurrence (daily / weekdays / custom days)
- Checking a box (or all N sub-checks) marks that portion complete and
  updates today's running score in real time.
- Tasks reset each day based on recurrence rules; history is preserved per day.

### 2.2 Points & Daily Grade
- Each user has a max possible points total for the day (sum of all active
  task points).
- Daily grade = `(points earned / points possible) * 100`.
- Grade buckets for calendar coloring, e.g.:
  - 90–100%: green
  - 70–89%: yellow
  - 40–69%: orange
  - 0–39%: red
  - No tasks logged: gray

### 2.3 Multi-User Visibility
- All users can see:
  - Other users' daily goal lists (read-only) and which items are checked
  - Points per item
  - Each user's calendar with the day's grade/color
- Only the owning user can edit/check their own tasks.
- A "People" or "Household" view lists all members with today's grade at a glance.

### 2.4 Calendar View
- Month-grid calendar per user (or a combined view with tabs/avatars per person).
- Each day cell shows the grade color + numeric score (e.g. "85%").
- Clicking a day opens that day's goal breakdown (which tasks were done, points earned).

---

## 3. Data Model (suggested)

```
User
 - id, name, email, avatar

Goal (template, owned by a User)
 - id, user_id, title, points, type [simple|counted], count (nullable),
   recurrence [daily|weekdays|custom], active (bool), created_at

DailyGoalInstance (a Goal materialized for a specific date)
 - id, goal_id, user_id, date, points_possible

SubCheck (for counted goals; simple goals can use count=1)
 - id, daily_goal_instance_id, index (1..N), completed (bool), completed_at

DayScore (denormalized/cached, one per user per date)
 - id, user_id, date, points_earned, points_possible, grade_percent
```

Notes:
- `SubCheck` unifies simple and counted items — a simple task is just count=1.
- `DayScore` can be computed on the fly or cached/recalculated on each check
  toggle for fast calendar rendering.

---

## 4. Pages / Routes

| Route | Purpose |
|---|---|
| `/login` | Auth |
| `/goals` | Today's daily goals tab (edit/check own tasks) |
| `/goals/new` | Add a new goal/task |
| `/calendar` | Your calendar of daily grades |
| `/calendar/:date` | Breakdown of a specific day |
| `/people` | List of all users + today's grade |
| `/people/:userId` | View another user's goals (read-only) + their calendar |

---

## 5. Scoring Logic (pseudo-code)

```
function toggleSubCheck(subCheckId):
    subCheck.completed = !subCheck.completed
    save(subCheck)
    recalculateDayScore(subCheck.dailyGoalInstance.user_id, date)

function recalculateDayScore(user_id, date):
    instances = getDailyGoalInstances(user_id, date)
    points_possible = sum(instance.points_possible for instance in instances)
    points_earned = sum(
        instance.points_possible * (completed_subchecks / total_subchecks)
        for instance in instances
    )
    grade = points_possible > 0 ? (points_earned / points_possible) * 100 : null
    upsert DayScore(user_id, date, points_earned, points_possible, grade)
```

---

## 6. Suggested Tech Stack

- **Frontend:** React (or Next.js) + Tailwind for styling
- **Backend:** Next.js API routes / Node+Express, or Python (FastAPI)
- **Database:** PostgreSQL (relational fits the model well) via Prisma/SQLAlchemy
- **Auth:** simple email/password or magic link (NextAuth, Clerk, or Supabase Auth)
- **Realtime updates (optional):** WebSockets or polling so other users see
  checks update live
- **Hosting:** Vercel (frontend+API) + Supabase/Neon (Postgres)

---

## 7. Build Phases

1. **Phase 1 — Core single-user goals**
   - Auth, create/edit/delete goals, simple + counted task types, daily checklist UI
2. **Phase 2 — Scoring & calendar**
   - Daily grade calculation, month calendar view with color-coded days, day detail drill-down
3. **Phase 3 — Multi-user**
   - People list, read-only views of others' goals/calendars, permissions
4. **Phase 4 — Polish**
   - Recurrence rules, categories/tags, streaks, notifications/reminders, mobile responsiveness
5. **Phase 5 — Nice-to-haves**
   - Leaderboard across users, weekly/monthly summary stats, export data, dark mode

---

## 8. Open Questions to Decide Before Building

- Should counted-item points be split evenly, or can each sub-check have its own weight?
- Should past days' goals be editable, or locked once the day ends?
- Should visibility be "everyone sees everyone" or group/friend-based permissions?
- Timezone handling for when a "day" starts/ends per user.
