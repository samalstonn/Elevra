export function Input({ className = '', ...props }) {
    const baseStyles = 'border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300 text-left';
  
    return (
      <input
        className={`
          ${baseStyles} 
          ${className}
        `}
        style={{ textAlign: 'left', ...props.style }}
        {...props}
      />
    );
}