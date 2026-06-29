import Avatar, { type AvatarPerson, type AvatarSize } from "./Avatar";
import { cn } from "@/lib/utils";

const SIZE_CLS: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
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
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex -space-x-2 shrink-0">
      {visible.map((p) => (
        <Avatar key={p._id} person={p} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            SIZE_CLS[size],
            "rounded-full ring-2 ring-background bg-muted text-muted-foreground flex items-center justify-center font-semibold"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}