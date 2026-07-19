import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
}

export default function Icon({ name, className = '', fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`,
      }}
    >
      {name}
    </span>
  );
}
