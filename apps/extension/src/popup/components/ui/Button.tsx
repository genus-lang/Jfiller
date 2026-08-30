import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    outline: 'none'
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
      color: 'white',
      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-light)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary-accent)',
      border: '1px solid var(--primary-accent)',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant] }}
      className={className}
      onMouseEnter={(e) => {
        if(variant === 'primary') e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if(variant === 'primary') e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};
