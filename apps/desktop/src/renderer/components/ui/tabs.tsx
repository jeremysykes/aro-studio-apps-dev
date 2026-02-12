'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
	'inline-flex items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-600',
	{
		variants: {
			size: {
				default: 'h-10',
				xs: 'h-8 text-xs',
			},
		},
		defaultVariants: { size: 'default' },
	}
);

const tabsTriggerVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm',
	{
		variants: {
			size: {
				default: 'px-3 py-1.5 text-sm',
				xs: 'px-2 py-1 text-xs',
			},
		},
		defaultVariants: { size: 'default' },
	}
);

export interface TabsListProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
		VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	TabsListProps
>(({ className, size, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(tabsListVariants({ size }), className)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
	extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
		VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	TabsTriggerProps
>(({ className, size, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(tabsTriggerVariants({ size }), className)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
