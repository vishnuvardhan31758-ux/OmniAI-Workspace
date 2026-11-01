import React from 'react';

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
}: TextareaProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200 resize-vertical
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error 
            ? 'border-error-500 bg-error-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      {error && (
        <p className="text-sm text-error-600 animate-fade-in">{error}</p>
      )}
    </div>
  );
}