// ============================================================
// components/ui/Avatar.tsx
// Renders a profile photo (if available) or initials on a
// deterministic colour. Replaces near-identical avatar JSX
// in: ChatConversationList, ChatRoom, WorkspacePage,
//     CategoryPage, FreelancerDetailPage, SearchPage,
//     ClientDashboard, FreelancerDashboard.
// ============================================================

import { memo } from "react";
import { avatarColorFor } from "../utils/tokens";

export interface AvatarPerson {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  person: AvatarPerson;
  size?: AvatarSize;
  online?: boolean;   // undefined → no indicator; true/false → show dot
  className?: string;
}

const SIZE: Record<AvatarSize, string> = {
  xs: "w-7  h-7  text-[10px]",
  sm: "w-8  h-8  text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const DOT: Record<AvatarSize, string> = {
  xs: "w-2   h-2   -bottom-px -right-px",
  sm: "w-2.5 h-2.5 bottom-0 right-0",
  md: "w-3   h-3   bottom-0 right-0",
  lg: "w-3.5 h-3.5 bottom-0 right-0",
  xl: "w-4   h-4   bottom-0 right-0",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "").toUpperCase();
}

const Avatar = memo(({ person, size = "md", online, className = "" }: AvatarProps) => {
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${SIZE[size]} rounded-full flex items-center justify-center font-semibold text-white overflow-hidden ring-2 ring-white select-none`}
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
          className={`absolute rounded-full border-2 border-white ${DOT[size]} ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";
export default Avatar;