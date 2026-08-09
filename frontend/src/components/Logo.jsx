import React, { useId } from 'react';

export default function Logo({ size = 32, className = '' }) {
  const id = useId();
  
  return (
    <div className={`logo-icon-svg ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
        <defs>
          <linearGradient id={`logoBgGrad-${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E293B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id={`logoAccentGrad-${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id={`logoHighlight-${id}`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Base Rounded Square */}
        <rect width="64" height="64" rx="16" fill={`url(#logoBgGrad-${id})`} />
        <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke={`url(#logoHighlight-${id})`} strokeWidth="1.5" />
        
        {/* Inner 'Null' Circle */}
        <circle cx="32" cy="32" r="12" stroke={`url(#logoAccentGrad-${id})`} strokeWidth="4" />
        
        {/* The 'Drift' Slash & Data Nodes */}
        <path d="M 18 46 L 46 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="46" cy="18" r="4" fill="#3B82F6" />
        <circle cx="18" cy="46" r="4" fill="#8B5CF6" />
      </svg>
    </div>
  );
}
