import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'cyan' | 'green' | 'yellow' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.label ? (
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {trend.label}
                </span>
              ) : (
                <>
                  <span className={`text-sm font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;