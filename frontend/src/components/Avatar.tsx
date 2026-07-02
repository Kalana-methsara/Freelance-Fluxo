import { getInitials } from '@/utils/auth';
import React from 'react';

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function getColor(id: string) {
  if (!id) return AVATAR_COLORS[0];
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

export interface AvatarPerson {
  _id?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  person: AvatarPerson;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ person, size = 'md', className = '', online = false }) => {
  const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'U';
  const initials = getInitials(name);
  const color = getColor(person._id || name);
  const dimension = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  }[size];

  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0 ${dimension} ${className}`} style={{ background: person.profileImage ? 'transparent' : color }}>
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}

      {person.profileImage ? (
        <img src={person.profileImage} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;