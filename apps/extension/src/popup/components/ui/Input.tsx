import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    width: '100%'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--input-bg)',
    border: '1px solid var(--border-light)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
  };

  const mergedStyle = { ...inputStyle, ...(props.style || {}) };

  return (
    <div style={containerStyle}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input 
        id={id}
        {...props} 
        style={mergedStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary-accent)';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.boxShadow = 'none';
          if (props.onBlur) props.onBlur(e);
        }}
      />
    </div>
  );
};
