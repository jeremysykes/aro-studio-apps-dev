import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					'flex min-h-[60px] w-full rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-xs text-foreground-default ring-offset-white appearance-none placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-muted focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Textarea.displayName = 'Textarea';

export { Textarea };
