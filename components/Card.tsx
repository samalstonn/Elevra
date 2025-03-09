import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => (
  <div className={`bg-white p-4 ${className}`}>{children}</div>
);

export const CardContent = ({ children, className }: CardProps) => <div className={className}>{children}</div>;

interface CardTitleProps {
  children: ReactNode;
}

export const CardTitle = ({ children }: CardTitleProps) => (
  <h3 className="text-lg font-bold">{children}</h3>
);

export const CardDescription = ({ children }: CardTitleProps) => (
  <p className="text-sm text-gray-600">{children}</p>
);
  