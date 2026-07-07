
const AVATAR_COLORS = [
  "#14a800", 
  "#7c3aed", 
  "#dc2626", 
  "#d97706", 
  "#0891b2", 
  "#c026d3", 
  "#059669", 
];


export function avatarColorFor(id: string | undefined | null): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}