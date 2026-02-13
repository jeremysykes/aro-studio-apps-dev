import React, { Suspense } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import type { ModuleRegistryEntry } from './Sidebar';

interface WidgetCardProps {
  module: ModuleRegistryEntry;
  onExpand: (moduleKey: string) => void;
}

function WidgetPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
      {label}
    </div>
  );
}

/**
 * Dashboard widget card. Renders a module's compact widget (or placeholder)
 * inside a Card with a header and "Open" action.
 */
export function WidgetCard({ module, onExpand }: WidgetCardProps) {
  const WidgetComponent = module.widget;

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base truncate">{module.label}</CardTitle>
          {module.description && (
            <CardDescription className="text-xs truncate">
              {module.description}
            </CardDescription>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="ml-2 shrink-0"
          onClick={() => onExpand(module.key)}
          aria-label={`Open ${module.label}`}
        >
          Open &rarr;
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        <WidgetErrorBoundary moduleLabel={module.label}>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            {WidgetComponent ? (
              <WidgetComponent />
            ) : (
              <WidgetPlaceholder label={module.label} />
            )}
          </Suspense>
        </WidgetErrorBoundary>
      </CardContent>
    </Card>
  );
}
