/**
 * Tournament format support.
 *
 * Only `single_elimination` is fully implemented in the bracket/match engine.
 * Other formats are defined as future values in the database schema but must
 * not be used for live tournaments until their engines are built.
 *
 * SUPPORTED_FORMATS is the source of truth used by both server-side
 * validation (tournamentActions) and the bracket generation engine.
 */

export const SUPPORTED_FORMATS = ["single_elimination"] as const;

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

/**
 * Returns true when `format` is one of the fully-implemented tournament
 * formats that can be used for bracket generation and match play.
 */
export function isSupportedTournamentFormat(format: string): boolean {
  return (SUPPORTED_FORMATS as readonly string[]).includes(format);
}
