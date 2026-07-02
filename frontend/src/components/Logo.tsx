import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const textSize = size === 'sm' ? 'text-lg' : 'text-2xl sm:text-3xl';
  return (
    <span className={`${textSize} font-serif tracking-tight text-gray-900`}>
      freelance<span className="italic text-emerald-600">fluxo</span>
    </span>
  );
};

export default Logo;