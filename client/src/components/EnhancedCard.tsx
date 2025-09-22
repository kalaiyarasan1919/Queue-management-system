import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EnhancedCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  gradient?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

export function EnhancedCard({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className,
  gradient = 'primary',
  animated = true
}: EnhancedCardProps) {
  const gradientClasses = {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-pink-500 to-rose-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    danger: 'from-red-500 to-pink-500'
  };

  return (
    <Card className={cn(
      'card-enhanced group',
      animated && 'animate-slide-in-up',
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br',
              gradientClasses[gradient],
              'text-white shadow-lg group-hover:scale-110 transition-transform duration-300'
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon?: React.ReactNode;
  gradient?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  gradient = 'primary',
  animated = true
}: StatCardProps) {
  const gradientClasses = {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-pink-500 to-rose-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    danger: 'from-red-500 to-pink-500'
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={cn(
      'dashboard-card group',
      animated && 'animate-fade-in-scale'
    )}>
      <div className="dashboard-card-header">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className={cn(
              'p-2 rounded-lg bg-gradient-to-br',
              gradientClasses[gradient],
              'text-white shadow-md group-hover:scale-110 transition-transform duration-300'
            )}>
              {icon}
            </div>
          )}
          <h3 className="dashboard-card-title">{title}</h3>
        </div>
        {change && (
          <span className={cn(
            'dashboard-card-change',
            changeColors[change.type]
          )}>
            {change.value}
          </span>
        )}
      </div>
      <div className="dashboard-card-value">
        {value}
      </div>
    </div>
  );
}

interface QueueItemProps {
  tokenNumber: string;
  name: string;
  service: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  priority?: 'normal' | 'senior' | 'disabled' | 'emergency';
  estimatedWait?: string;
  isCurrent?: boolean;
  animated?: boolean;
}

export function QueueItem({ 
  tokenNumber, 
  name, 
  service, 
  status, 
  priority = 'normal',
  estimatedWait,
  isCurrent = false,
  animated = true
}: QueueItemProps) {
  const statusClasses = {
    waiting: 'status-waiting',
    serving: 'status-serving',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  };

  const priorityClasses = {
    normal: 'priority-normal',
    senior: 'priority-senior',
    disabled: 'priority-disabled',
    emergency: 'priority-emergency'
  };

  return (
    <div className={cn(
      'queue-item group',
      isCurrent && 'current',
      priority !== 'normal' && 'priority',
      animated && 'animate-slide-in-right'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg',
            isCurrent ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700'
          )}>
            {tokenNumber}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{name}</h4>
            <p className="text-sm text-gray-600">{service}</p>
            {estimatedWait && (
              <p className="text-xs text-gray-500">Est. wait: {estimatedWait}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('status-indicator', statusClasses[status])}>
            {status}
          </span>
          {priority !== 'normal' && (
            <span className={cn('priority-badge', priorityClasses[priority])}>
              {priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
