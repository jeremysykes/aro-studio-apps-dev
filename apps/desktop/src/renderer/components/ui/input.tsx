import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 ring-offset-white appearance-none file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:ring-offset-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-400',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';

export { Input };
