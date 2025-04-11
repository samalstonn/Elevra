import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"; // Icons

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number; // Optional percentage change
  icon?: LucideIcon; // Optional icon component
}

export function StatsCard({
  label,
  value,
  change,
  icon: Icon,
}: StatsCardProps) {
  const ChangeIcon =
    change && change > 0
      ? TrendingUp
      : change && change < 0
      ? TrendingDown
      : null;
  const changeColor =
    change && change > 0
      ? "text-green-600"
      : change && change < 0
      ? "text-red-600"
      : "text-gray-500";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {label}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeColor} flex items-center`}>
            {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
