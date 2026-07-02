import React from 'react';

const STATUS_STYLES: Record<string, string> = {
  active:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress:  'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  completed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:        'bg-gray-100 text-gray-500 border-gray-200',
  open:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:      'bg-amber-50 text-amber-600 border-amber-200',
  shortlisted:  'bg-purple-50 text-purple-700 border-purple-200',
  rejected:     'bg-red-50 text-red-600 border-red-200',
  hired:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined:     'bg-red-50 text-red-600 border-red-200',
  cancelled:    'bg-gray-100 text-gray-500 border-gray-200',
  disputed:     'bg-orange-50 text-orange-700 border-orange-200',
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const base = 'inline-flex items-center rounded-full font-medium capitalize border';
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`${base} ${sizing} ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;