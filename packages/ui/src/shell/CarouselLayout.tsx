import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '../components/ui/carousel';
import { cn } from '../lib/utils';
import type { ModuleRegistryEntry } from './Sidebar';

interface CarouselLayoutProps {
  modules: ModuleRegistryEntry[];
}

/**
 * Carousel shell layout using shadcn Carousel (Embla). One module visible at a time
 * with left/right arrow navigation and dot indicators. No persistent nav chrome.
 * Mobile-friendly.
 *
 * We measure the container width in JS and set an explicit pixel width on each
 * slide so that child min-width constraints (e.g. Inspect's min-w-[900px])
 * cannot inflate the slide and throw off Embla's translate calculations.
 */
export function CarouselLayout({ modules }: CarouselLayoutProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState<number | null>(null);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setSlideWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Re-init Embla after slide width changes so it picks up correct measurements
  useEffect(() => {
    if (api && slideWidth != null) {
      api.reInit();
    }
  }, [api, slideWidth]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    setSelectedIndex(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => api.off('select', onSelect);
  }, [api]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'start',
          containScroll: 'trimSnaps',
          dragFree: false,
        }}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <CarouselContent className="-ml-0 h-full w-full min-w-0">
          {modules.map((mod) => (
            <CarouselItem
              key={mod.key}
              className="pl-0 flex flex-col min-h-0 overflow-hidden"
              style={slideWidth != null ? { width: slideWidth, minWidth: slideWidth, maxWidth: slideWidth } : undefined}
            >
              <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto pb-12">
                {mod.component ? <mod.component /> : null}
              </div>
            </CarouselItem>
          ))}
          </CarouselContent>
        </div>

        {/* Navigation bar — sticky at bottom, never scrolls */}
        <footer className="flex shrink-0 items-center justify-center gap-4 h-12 px-4 border-t border-zinc-200 bg-zinc-50">
          <CarouselPrevious variant="ghost" className="h-8 w-8 rounded-full" />
          <div className="flex items-center gap-2">
            {modules.map((mod, i) => (
              <button
                key={mod.key}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === selectedIndex ? 'bg-zinc-900' : 'bg-zinc-300 hover:bg-zinc-400'
                )}
                aria-label={mod.label}
                aria-current={i === selectedIndex ? 'page' : undefined}
              />
            ))}
          </div>
          <CarouselNext variant="ghost" className="h-8 w-8 rounded-full" />
        </footer>
      </Carousel>
    </div>
  );
}
