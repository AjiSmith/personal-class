import React from 'react';

export function DashboardCard({ label, value, suffix, accent = 'text-secondary' }) {
  return (
    <div className="bg-tertiary text-on-surface border border-border rounded-xl p-[32px_24px]">
      <h3 className="text-on-surface-muted font-sans text-xs uppercase tracking-[0.14em] font-semibold">
        {label}
      </h3>
      <p className={`font-sans text-[37.8px] font-bold mt-[8px] leading-none ${accent}`}>
        {value}
        {suffix && <span className="text-lg font-light text-on-surface-muted"> {suffix}</span>}
      </p>
    </div>
  );
}
