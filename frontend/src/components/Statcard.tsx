import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, sub, accent = false }) => {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${
        accent ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-100 hover:border-emerald-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-medium ${accent ? 'text-emerald-100' : 'text-gray-500'}`}>{label}</p>
        <div className={`p-2 rounded-xl ${accent ? 'bg-emerald-500/30' : 'bg-gray-50'}`}>
          <Icon />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-emerald-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
};