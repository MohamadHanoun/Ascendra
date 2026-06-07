-- Remove legacy Match model (superseded by TournamentMatch).
--
-- The legacy "Match" table has no live writer and was confirmed empty
-- (SELECT COUNT(*) FROM "Match" = 0) before this migration. Dropping the
-- table also removes its own indexes, unique constraint, and the foreign
-- keys it declared toward "Tournament" and "Team". No other table references
-- "Match", so no dependent objects elsewhere are affected.
--
-- TournamentMatch and all other tables are intentionally left untouched.

DROP TABLE IF EXISTS "Match";
