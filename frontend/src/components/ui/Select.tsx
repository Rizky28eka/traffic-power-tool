import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    options,
    placeholder,
    id,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 theme-transition"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'block w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm shadow-sm transition-colors appearance-none theme-transition',
              'text-secondary-900 dark:text-secondary-100',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
              'disabled:cursor-not-allowed disabled:bg-secondary-50 dark:disabled:bg-secondary-900 disabled:text-secondary-500 dark:disabled:text-secondary-600',
              error && 'border-error-300 dark:border-error-600 focus:border-error-500 focus:ring-error-500 dark:focus:border-error-400 dark:focus:ring-error-400',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-secondary-400 dark:text-secondary-500" />
          </div>
        </div>
        
        {(error || helperText) && (
          <p className={cn(
            'mt-2 text-sm theme-transition',
            error ? 'text-error-600 dark:text-error-400' : 'text-secondary-600 dark:text-secondary-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;