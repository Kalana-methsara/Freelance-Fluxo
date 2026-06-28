// =============================================================
// src/components/Avatar.tsx
// =============================================================
// One avatar component for the whole app. Renders a profile photo
// if present, otherwise initials on a deterministic color.
//
// Replaces near-identical inline JSX previously duplicated in:
//   ChatConversationList.tsx, ChatRoom.tsx, WorkspacePage.tsx,
//   CategoryPage.tsx, FreelancerDetailPage.tsx
//
// Usage:
//   <Avatar person={user} size="md" online={isOnline} />
// =============================================================

import { memo } from "react";
import { avatarColorFor } from "../utils/avatar";
import { getInitials } from "../utils/auth";

export interface AvatarPerson {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  person: AvatarPerson;
  size?: AvatarSize;
  /** Pass true/false to show an online status dot. Omit to hide it entirely. */
  online?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

const DOT_CLASSES: Record<AvatarSize, string> = {
  xs: "w-2 h-2 -bottom-px -right-px",
  sm: "w-2.5 h-2.5 bottom-0 right-0",
  md: "w-3 h-3 bottom-0 right-0",
  lg: "w-3.5 h-3.5 bottom-0 right-0",
};

const Avatar = memo(({ person, size = "md", online, className = "" }: AvatarProps) => {
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-bold text-white overflow-hidden ring-2 ring-white`}
        style={{ background: avatarColorFor(person._id) }}
        title={name}
      >
        {person.profileImage ? (
          <img src={person.profileImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute rounded-full border-2 border-white ${DOT_CLASSES[size]} ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";
export default Avatar;