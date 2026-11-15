import React from 'react';
import { PowerType } from '../game/types';

interface PowerIconProps {
  power: PowerType;
  size?: number;
  className?: string;
}

export const PowerIcon: React.FC<PowerIconProps> = ({ power, size = 24, className = '' }) => {
  if (power === 'fire') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
        <path
          d="M16 2C16 2 25 10 25 18.5C25 24.3 20.9 29 16 29C11.1 29 7 24.3 7 18.5C7 14 9.6 10.2 12 8C12 8 11.8 12.2 14.5 13.5C13.8 9.2 16 2 16 2Z"
          fill="#f97316"
          stroke="#0b1633"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 12C16 12 20.5 16.5 20.5 20.8C20.5 23.8 18.5 26 16 26C13.5 26 11.5 23.8 11.5 20.8C11.5 18.2 13.5 15.6 16 12Z"
          fill="#fde047"
        />
      </svg>
    );
  }

  if (power === 'ice') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
        <path
          d="M16 3L21 10L28 11L23 17L26 25L16 22L6 25L9 17L4 11L11 10L16 3Z"
          fill="#38bdf8"
          stroke="#0b1633"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 7L19 13L16 19L13 13L16 7Z"
          fill="#e0f2fe"
        />
      </svg>
    );
  }

  if (power === 'lightning') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
        <path
          d="M18 2L6 17H15L13 30L26 14H17L18 2Z"
          fill="#facc15"
          stroke="#0b1633"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M16.5 6L10.5 15H16L15 24L22 15.5H16.5V6Z" fill="#fef9c3" />
      </svg>
    );
  }

  // super
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#9333ea" stroke="#0b1633" strokeWidth="2.2" />
      <path
        d="M16 6L18.8 12.2L25.5 13L20.5 17.5L22 24.2L16 20.8L10 24.2L11.5 17.5L6.5 13L13.2 12.2L16 6Z"
        fill="#facc15"
        stroke="#0b1633"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};
