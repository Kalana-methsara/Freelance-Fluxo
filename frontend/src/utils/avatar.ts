// =============================================================
// src/utils/avatar.ts
// =============================================================
// Single source of truth for avatar color assignment.
//
// Before: CategoryPage, FreelancerDetailPage, ChatConversationList,
// and WorkspacePage each defined their own (slightly different)
// AVATAR_COLORS array and their own char-code-to-color function.
// That's the kind of drift that makes the same user show up in a
// different color on two pages. This is the one place it lives now.
// =============================================================

const AVATAR_COLORS = [
  "#14a800", // emerald
  "#7c3aed", // violet
  "#dc2626", // red
  "#d97706", // amber
  "#0891b2", // cyan
  "#c026d3", // fuchsia
  "#059669", // teal
];

/**
 * Deterministically maps any user id to one of the palette colors.
 * Same id -> same color, every time, on every page.
 */
export function avatarColorFor(id: string | undefined | null): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}