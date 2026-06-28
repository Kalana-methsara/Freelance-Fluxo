// =============================================================
// src/components/AvatarGroup.tsx
// =============================================================
// Stacked avatar cluster for group conversations / job participants.
// Replaces the hand-rolled "-space-x-2" avatar stacks duplicated in
// ChatConversationList.tsx and ChatRoom.tsx.
// =============================================================

import Avatar, {type AvatarPerson,type AvatarSize } from "./Avatar";

interface AvatarGroupProps {
  people: AvatarPerson[];
  max?: number;
  size?: AvatarSize;
}

export default function AvatarGroup({ people, max = 3, size = "md" }: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  const sizeClass = { xs: "w-7 h-7 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];

  return (
    <div className="flex -space-x-2 shrink-0">
      {visible.map((person) => (
        <Avatar key={person._id} person={person} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClass} rounded-full ring-2 ring-white bg-slate-700 text-white font-semibold flex items-center justify-center`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}