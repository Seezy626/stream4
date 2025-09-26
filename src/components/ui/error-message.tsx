import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Shield,
  Database,
  FileX,
  Clock,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorType =
  | 'network'
  | 'server'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'timeout'
  | 'unknown'
  | 'maintenance';

interface ErrorMessageProps {
  error?: Error | string;
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showRetry?: boolean;
  showSupport?: boolean;
  className?: string;
  compact?: boolean;
}

const ERROR_CONFIG: Record<ErrorType, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultMessage: string;
  color: 'default' | 'destructive';
}> = {
  network: {
    icon: Wifi,
    title: 'Connection Problem',
    defaultMessage: 'Unable to connect to our servers. Please check your internet connection and try again.',
    color: 'destructive',
  },
  server: {
    icon: Database,
    title: 'Server Error',
    defaultMessage: 'Our servers are experiencing issues. Please try again in a few moments.',
    color: 'destructive',
  },
  authentication: {
    icon: Shield,
    title: 'Authentication Required',
    defaultMessage: 'Please sign in to continue accessing this feature.',
    color: 'default',
  },
  authorization: {
    icon: Shield,
    title: 'Access Denied',
    defaultMessage: 'You don\'t have permission to access this resource.',
    color: 'destructive',
  },
  validation: {
    icon: AlertTriangle,
    title: 'Invalid Input',
    defaultMessage: 'Please check your input and try again.',
    color: 'default',
  },
  not_found: {
    icon: FileX,
    title: 'Not Found',
    defaultMessage: 'The resource you\'re looking for doesn\'t exist.',
    color: 'default',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    defaultMessage: 'The request took too long to complete. Please try again.',
    color: 'default',
  },
  maintenance: {
    icon: RefreshCw,
    title: 'Under Maintenance',
    defaultMessage: 'We\'re currently performing maintenance. Please check back soon.',
    color: 'default',
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    color: 'destructive',
  },
};

export function ErrorMessage({
  error,
  type = 'unknown',
  title,
  message,
  onRetry,
  onContactSupport,
  showRetry = true,
  showSupport = true,
  className,
  compact = false,
}: ErrorMessageProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.defaultMessage;

  // Extract error message from Error object if provided
  const errorMessage = error instanceof Error ? error.message : error;

  if (compact) {
    return (
      <Alert variant={config.color} className={cn('border-l-4', className)}>
        <Icon className="h-4 w-4" />
        <AlertTitle className="text-sm">{displayTitle}</AlertTitle>
        <AlertDescription className="text-sm">
          {errorMessage || displayMessage}
        </AlertDescription>
        {(showRetry || showSupport) && (
          <div className="mt-2 flex gap-2">
            {showRetry && onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
            {showSupport && onContactSupport && (
              <Button size="sm" variant="ghost" onClick={onContactSupport}>
                <HelpCircle className="mr-1 h-3 w-3" />
                Support
              </Button>
            )}
          </div>
        )}
      </Alert>
    );
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className={cn(
          'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
          config.color === 'destructive' && 'bg-destructive/10',
          config.color === 'default' && 'bg-muted'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            config.color === 'destructive' && 'text-destructive',
            config.color === 'default' && 'text-muted-foreground'
          )} />
        </div>
        <CardTitle className="text-xl">{displayTitle}</CardTitle>
        <CardDescription className="text-base">
          {errorMessage || displayMessage}
        </CardDescription>
      </CardHeader>
      {(showRetry || showSupport) && (
        <CardContent className="space-y-3">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showSupport && onContactSupport && (
            <Button variant="outline" onClick={onContactSupport} className="w-full">
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          )}
          {process.env.NODE_ENV === 'development' && errorMessage && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-all">
                {errorMessage}
              </pre>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Specialized error components for common scenarios
export function NetworkError({ onRetry, className }: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorMessage
      type="network"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function ServerError({ onRetry, className }: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorMessage
      type="server"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function NotFoundError({ onRetry, className }: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorMessage
      type="not_found"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function MaintenanceError({ className }: {
  className?: string;
}) {
  return (
    <ErrorMessage
      type="maintenance"
      showRetry={false}
      className={className}
    />
  );
}

// Inline error message for forms and small spaces
export function InlineError({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm text-destructive',
      className
    )}>
      <AlertTriangle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

// Toast error message for notifications
export function ToastError({
  title,
  message,
  onAction,
  actionLabel
}: {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <Alert variant="destructive" className="border-l-4">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="text-sm font-medium">{title}</AlertTitle>
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </div>
      {onAction && actionLabel && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Alert>
  );
}