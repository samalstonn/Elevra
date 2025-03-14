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