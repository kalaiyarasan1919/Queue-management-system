import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bounce';
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className,
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
        {text && (
          <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        <div className={cn(
          'bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse',
          sizeClasses[size]
        )}></div>
        {text && (
          <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        <div className={cn(
          'bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-bounce',
          sizeClasses[size]
        )}></div>
        {text && (
          <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative">
        <div className={cn(
          'border-4 border-blue-200 rounded-full animate-spin',
          sizeClasses[size]
        )}></div>
        <div className={cn(
          'border-4 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0',
          sizeClasses[size]
        )}></div>
      </div>
      {text && (
        <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'avatar' | 'card' | 'button';
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'text',
  lines = 1
}: SkeletonProps) {
  if (variant === 'avatar') {
    return (
      <div className={cn('skeleton-avatar', className)}></div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('card-enhanced p-6', className)}>
        <div className="space-y-4">
          <div className="skeleton-text h-6 w-3/4"></div>
          <div className="skeleton-text h-4 w-1/2"></div>
          <div className="skeleton-text h-4 w-2/3"></div>
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn('skeleton h-10 w-24 rounded-lg', className)}></div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'skeleton-text',
            i === lines - 1 ? 'w-2/3' : 'w-full',
            className
          )}
        ></div>
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, text, children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}
