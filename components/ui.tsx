
import { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    variant?: 'default' | 'ghost' | 'outline';
    className?: string;
  };
  
// Button Component
export function Button({ variant = 'default', className = '', children, ...props }: ButtonProps) {
    const baseStyles = 'px-4 py-2 font-medium focus:outline-none';
    const variants = {
      default: 'bg-black text-white rounded-full shadow-lg hover:bg-gray-800',
      ghost: 'bg-transparent rounded-full text-gray-700 hover:bg-gray-100',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
    };
  
    return (
      <button
        className={`
          ${baseStyles} 
          ${variants[variant] || variants.default} 
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
  
  // Input Component
  export function Input({ className = '', ...props }) {
    const baseStyles = 'border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300';
  
    return (
      <input
        className={`
          ${baseStyles} 
          ${className}
        `}
        {...props}
      />
    );
  }