'use client';

import React, { useState, useEffect } from 'react';

interface PageHeaderProps {
  path: string;
  defaultBadge: string;
  defaultTitle: string;
  defaultDesc: string;
  className?: string;
}

export default function PageHeader({
  path,
  defaultBadge,
  defaultTitle,
  defaultDesc,
  className = '',
}: PageHeaderProps) {
  const [badge, setBadge] = useState(defaultBadge);
  const [title, setTitle] = useState(defaultTitle);
  const [desc, setDesc] = useState(defaultDesc);

  useEffect(() => {
    fetch(`/api/page-headers?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.title) {
          if (data.badge !== undefined) setBadge(data.badge);
          setTitle(data.title);
          if (data.description !== undefined) setDesc(data.description);
        }
      })
      .catch(() => {
        // Fallback to default props on error
      });
  }, [path]);

  return (
    <div className={`text-left select-none ${className}`}>
      {badge && (
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2 inline-block animate-fade-in-up">
          {badge}
        </span>
      )}
      <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight animate-fade-in-up">
        {title}
      </h1>
      {desc && (
        <p className="text-xs md:text-sm text-on-surface-variant font-semibold mt-1 animate-fade-in-up leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}
