import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = '20px', style }) => {
  return (
    <div 
      className={className}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: padding,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        ...style
      }}
    >
      {children}
    </div>
  );
};
