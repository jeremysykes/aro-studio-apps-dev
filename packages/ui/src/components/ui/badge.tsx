import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-zinc-900 text-zinc-50 shadow',
				secondary:
					'border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50',
				destructive:
					'border-transparent bg-red-600 text-white shadow',
				outline: 'text-zinc-900 border-zinc-200 dark:text-zinc-50 dark:border-zinc-800',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<span
				ref={ref}
				className={cn(badgeVariants({ variant }), className)}
				{...props}
			/>
		);
	}
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
