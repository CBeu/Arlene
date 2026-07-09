# Schema Setup

Run these scripts in the Supabase SQL Editor to build the database from scratch.

## Run order

The order matters: each script references tables, functions, or policies defined
by the ones before it.

| # | Script | Creates | Depends on |
|---|--------|---------|------------|
| 1 | [profileSchema.sql](profileSchema.sql) | `profiles` table, `handle_new_user` signup trigger | `auth.users` (built into Supabase) |
| 2 | [reunionSchema.sql](reunionSchema.sql) | `reunions` and `profile_reunions` tables, `is_reunion_member()` function | `profiles` |
| 3 | [nominationSchema.sql](nominationSchema.sql) | `reunion_nominations` table | `reunions`, `profiles`, `profile_reunions`, `is_reunion_member()` |
| 4 | [nominationCommentSchema.sql](nominationCommentSchema.sql) | `nomination_comments` table | `reunion_nominations`, `profiles`, `is_reunion_member()` |

## Migrations

The schema files above already include every change from `../migrations/` — they
reflect the current state of the database. The migration files exist to bring an
**existing** database up to date:

| Migration | What it changed | Folded into |
|-----------|-----------------|-------------|
| [002_member_visibility.sql](../migrations/002_member_visibility.sql) | Added `is_reunion_member()`; members of a reunion can see each other | reunionSchema.sql |
| [003_nomination_coordinates.sql](../migrations/003_nomination_coordinates.sql) | Added `lat`/`lng` geocoded at write time | nominationSchema.sql |
| [004_nomination_update_with_check.sql](../migrations/004_nomination_update_with_check.sql) | `WITH CHECK` on nomination updates | nominationSchema.sql |
| [005_reunion_update_with_check.sql](../migrations/005_reunion_update_with_check.sql) | `WITH CHECK` on reunion updates | reunionSchema.sql |
| [006_reunion_deadlines.sql](../migrations/006_reunion_deadlines.sql) | `nomination_deadline`/`voting_deadline` columns; inserts rejected past the deadline | reunionSchema.sql, nominationSchema.sql |

So: **fresh database → run the four schema files in order and skip the
migrations. Existing database → run only the migrations you haven't applied yet.**
