import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    outline: 'border border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-100',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };