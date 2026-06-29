// ============================================================
// components/ui/AvatarGroup.tsx
// ============================================================

import Avatar, { type AvatarPerson, type AvatarSize } from "./Avatar";

const SIZE_CLS: Record<AvatarSize, string> = {
  xs: "w-7  h-7  text-[10px]",
  sm: "w-8  h-8  text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function AvatarGroup({
  people,
  max = 3,
  size = "md",
}: {
  people: AvatarPerson[];
  max?: number;
  size?: AvatarSize;
}) {
  const visible  = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex -space-x-2 shrink-0">
      {visible.map((p) => (
        <Avatar key={p._id} person={p} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={`${SIZE_CLS[size]} rounded-full ring-2 ring-white bg-slate-700 text-white font-semibold flex items-center justify-center text-xs`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}