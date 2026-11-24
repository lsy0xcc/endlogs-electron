// Built-in reason table (repo-root change_reasons.json, ADR-0010 level-3
// fallback — a shipped asset, not mock data) and misc display constants.

import builtinReasons from '../../../change_reasons.json';
import type { ReasonTable } from '../types';

/**
 * The built-in change reason table. `version` is a date string, so it
 * doubles as the date (same contract as the previous mock assembly).
 */
export const builtinReasonTable: ReasonTable = {
  version: builtinReasons.version,
  date: builtinReasons.version,
  reasons: builtinReasons.reasons,
};

/** maxLookbackDays stub: TBD auto-detection (R7); constant 90 for now. */
export const MAX_LOOKBACK_DAYS = 90;
