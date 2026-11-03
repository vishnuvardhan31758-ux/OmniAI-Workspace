import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  required = false,
  className = '',
}: SelectProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error 
            ? 'border-error-500 bg-error-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-error-600 animate-fade-in">{error}</p>
      )}
    </div>
  );
}