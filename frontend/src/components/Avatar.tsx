import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { avatarColorFor } from "@/utils/tokens";

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
  online?: boolean;
  className?: string;
}

const avatarSizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const dotSizeClasses: Record<AvatarSize, string> = {
  xs: "h-1.5 w-1.5 -bottom-px -right-px",
  sm: "h-2 w-2 bottom-0 right-0",
  md: "h-2.5 w-2.5 bottom-0 right-0",
  lg: "h-3 w-3 bottom-0 right-0",
  xl: "h-3.5 w-3.5 bottom-0 right-0",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "").toUpperCase();
}

const Avatar = memo(({ person, size = "md", online, className }: AvatarProps) => {
  const [loaded, setLoaded] = useState(false);
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  const initials = getInitials(name);

  return (
    <div className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", avatarSizeClasses[size], className)}>
      {person.profileImage ? (
        <>
          {!loaded && <Skeleton className="h-full w-full" />}
          <img
            src={person.profileImage}
            alt={initials}
            className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{ background: avatarColorFor(person._id) }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-white",
            dotSizeClasses[size],
            online ? "bg-emerald-500" : "bg-gray-300"
          )}
        />
      )}
    </div>
  );
});

Avatar.displayName = "Avatar";
export default Avatar;