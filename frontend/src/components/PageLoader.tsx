import React from 'react';

export const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
    </div>
  </div>
);