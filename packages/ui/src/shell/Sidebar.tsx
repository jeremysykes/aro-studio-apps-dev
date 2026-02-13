import React from 'react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { cn } from '../lib/utils';

export interface ModuleRegistryEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  /** Optional compact widget for dashboard grid view. */
  widget?: React.ComponentType;
  /** Short description shown as subtitle on dashboard widget cards. */
  description?: string;
}

interface SidebarProps {
  modules: ModuleRegistryEntry[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function Sidebar({ modules, activeKey, onSelect }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex h-full w-14 flex-col items-center border-r border-zinc-200 bg-zinc-50 py-3 gap-1">
        {modules.map((mod, i) => (
          <React.Fragment key={mod.key}>
            {i > 0 && <Separator className="my-1 w-8" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 shrink-0',
                    activeKey === mod.key && 'bg-zinc-200',
                  )}
                  onClick={() => onSelect(mod.key)}
                  aria-label={mod.label}
                  aria-current={activeKey === mod.key ? 'page' : undefined}
                >
                  {mod.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{mod.label}</TooltipContent>
            </Tooltip>
          </React.Fragment>
        ))}
      </nav>
    </TooltipProvider>
  );
}
