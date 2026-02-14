import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import type { ModuleRegistryEntry } from './Sidebar';

interface CarouselLayoutProps {
  modules: ModuleRegistryEntry[];
}

/**
 * Carousel shell layout. One module visible at a time with left/right arrow
 * navigation and dot indicators. Only the active module is mounted to prevent
 * off-screen content from affecting layout.
 */
export function CarouselLayout({ modules }: CarouselLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const prev = () => setSelectedIndex((i) => (i - 1 + modules.length) % modules.length);
  const next = () => setSelectedIndex((i) => (i + 1) % modules.length);

  const ActiveComponent = modules[selectedIndex]?.component;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Slide viewport — only the active module is rendered */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>

      {/* Navigation bar — always at bottom */}
      <footer className="flex shrink-0 items-center justify-center gap-4 h-12 px-4 border-t border-zinc-200 bg-zinc-50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={prev}
          aria-label="Previous slide"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 12 6 8 10 4" />
          </svg>
        </Button>
        <div className="flex items-center gap-2">
          {modules.map((mod, i) => (
            <button
              key={mod.key}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === selectedIndex ? 'bg-zinc-900' : 'bg-zinc-300 hover:bg-zinc-400',
              )}
              aria-label={mod.label}
              aria-current={i === selectedIndex ? 'page' : undefined}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={next}
          aria-label="Next slide"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 4 10 8 6 12" />
          </svg>
        </Button>
      </footer>
    </div>
  );
}
