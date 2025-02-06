export const Card = ({ children, className }) => (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>{children}</div>
  );
  
  export const CardContent = ({ children, className }) => <div className={className}>{children}</div>;
  
  export const CardTitle = ({ children }) => (
    <h3 className="text-lg font-bold">{children}</h3>
  );
  
  export const CardDescription = ({ children }) => (
    <p className="text-sm text-gray-600">{children}</p>
  );
  