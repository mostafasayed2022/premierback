// ─── attribution.ts ──────────────────────────────────────────────────────────
// First-touch + last-touch attribution engine
// No PII. Stores only campaign/click IDs and landing page.

import type { Attribution, StoredAttribution } from "./types";
import {
  FIRST_TOUCH_KEY,
  LAST_TOUCH_KEY,
  FIRST_TOUCH_TTL_DAYS,
  LAST_TOUCH_TTL_DAYS,
} from "./types";

// ─── Supported URL Parameters ─────────────────────────────────────────────────
const ATTRIBUTION_PARAMS: (keyof Attribution)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "campaign_id",
  "adset_id",
  "ad_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "ttclid",
  "scclid",
  "sc_click_id",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

function isExpired(stored: StoredAttribution): boolean {
  return Date.now() > stored._expires_at;
}

function hasAttributionParams(attrs: Attribution): boolean {
  return ATTRIBUTION_PARAMS.some((k) => !!attrs[k]);
}

function readStorage(key: string): StoredAttribution | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    const parsed: StoredAttribution = JSON.parse(raw);
    if (isExpired(parsed)) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(
  key: string,
  attribution: Attribution,
  ttlDays: number,
): void {
  try {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const stored: StoredAttribution = {
      ...attribution,
      _stored_at: now,
      _expires_at: now + daysToMs(ttlDays),
    };
    const serialized = JSON.stringify(stored);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch {
    // Storage may be unavailable (private mode, quota exceeded)
  }
}

// ─── Parse Attribution From URL ───────────────────────────────────────────────
function parseAttributionFromURL(): Attribution {
  try {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const attrs: Attribution = {};

    for (const key of ATTRIBUTION_PARAMS) {
      const value = params.get(key);
      if (value) {
        (attrs as Record<string, string>)[key] = value;
      }
    }

    attrs.landing_page = window.location.pathname;
    attrs.referrer = document.referrer || undefined;

    return attrs;
  } catch {
    return {};
  }
}

// ─── Capture Attribution ──────────────────────────────────────────────────────
/**
 * Call this once per page load (via useAttribution hook).
 * Captures first-touch (30d, never overwrites) and last-touch (7d, always updates with new campaign).
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const current = parseAttributionFromURL();

  // ── First Touch ──
  // Only write if attribution params exist AND no valid first touch exists yet
  if (hasAttributionParams(current)) {
    const existingFirst = readStorage(FIRST_TOUCH_KEY);
    if (!existingFirst || isExpired(existingFirst)) {
      writeStorage(FIRST_TOUCH_KEY, current, FIRST_TOUCH_TTL_DAYS);
    }
  }

  // ── Last Touch ──
  // Update whenever new attribution params arrive. Preserve existing if no new params.
  if (hasAttributionParams(current)) {
    writeStorage(LAST_TOUCH_KEY, current, LAST_TOUCH_TTL_DAYS);
  } else {
    // No new params — if no existing last touch, store with just landing/referrer
    const existingLast = readStorage(LAST_TOUCH_KEY);
    if (!existingLast) {
      const meta: Attribution = {
        landing_page: current.landing_page,
        referrer: current.referrer,
      };
      writeStorage(LAST_TOUCH_KEY, meta, LAST_TOUCH_TTL_DAYS);
    }
  }
}

// ─── Get Attribution ──────────────────────────────────────────────────────────
/**
 * Returns the current last-touch attribution (for attaching to API requests).
 * Falls back to first-touch if last-touch is expired.
 */
export function getAttribution(): Attribution {
  const lastTouch = readStorage(LAST_TOUCH_KEY);
  if (lastTouch) {
    // Strip internal TTL fields before returning
    const { _stored_at: _s, _expires_at: _e, ...attrs } = lastTouch;
    return attrs;
  }

  const firstTouch = readStorage(FIRST_TOUCH_KEY);
  if (firstTouch) {
    const { _stored_at: _s, _expires_at: _e, ...attrs } = firstTouch;
    return attrs;
  }

  return {};
}

/**
 * Returns first-touch attribution (for analytics/reporting only).
 */
export function getFirstTouchAttribution(): Attribution {
  const firstTouch = readStorage(FIRST_TOUCH_KEY);
  if (firstTouch) {
    const { _stored_at: _s, _expires_at: _e, ...attrs } = firstTouch;
    return attrs;
  }
  return {};
}

/**
 * Strips empty/undefined values from attribution before sending to API.
 */
export function cleanAttribution(attribution: Attribution): Attribution {
  return Object.fromEntries(
    Object.entries(attribution).filter(([, v]) => v !== undefined && v !== "" && v !== null),
  ) as Attribution;
}
