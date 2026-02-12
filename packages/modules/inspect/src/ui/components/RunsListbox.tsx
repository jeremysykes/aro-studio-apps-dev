import React, { useRef } from 'react';
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@aro/desktop/components';

export interface RunsListboxItem {
	id: string;
}

/** Selection follows focus: arrow keys update both focus and selection, so the right column updates immediately. */
function handleRunsListKeyDown<T extends RunsListboxItem>(
	e: React.KeyboardEvent,
	items: T[],
	focusedId: string | null,
	onFocus: (id: string) => void,
	onSelect: (id: string) => void,
): void {
	if (items.length === 0) return;
	const idx = focusedId ? items.findIndex((r) => r.id === focusedId) : -1;
	let nextId: string | null = null;
	if (e.key === 'ArrowDown') {
		e.preventDefault();
		if (idx < items.length - 1) {
			nextId = items[idx + 1]!.id;
		} else if (idx === -1) {
			nextId = items[0]!.id;
		}
	} else if (e.key === 'ArrowUp') {
		e.preventDefault();
		if (idx > 0) {
			nextId = items[idx - 1]!.id;
		} else if (idx === -1) {
			nextId = items[items.length - 1]!.id;
		}
	} else if (e.key === 'Home') {
		e.preventDefault();
		nextId = items[0]!.id;
	} else if (e.key === 'End') {
		e.preventDefault();
		nextId = items[items.length - 1]!.id;
	}
	if (nextId) {
		onFocus(nextId);
		onSelect(nextId);
	}
}

function preventOptionFocus(e: React.MouseEvent) {
	e.preventDefault();
}

export interface RunsListboxProps<T extends RunsListboxItem> {
	items: T[];
	selectedId: string | null;
	focusedId: string | null;
	onSelect: (id: string) => void;
	onFocusChange: (id: string) => void;
	optionIdPrefix: string;
	getOptionLabel: (item: T) => string;
	getOptionTooltip?: (item: T) => string;
	listboxRef: React.RefObject<HTMLDivElement | null>;
	ariaLabel?: string;
}

export function RunsListbox<T extends RunsListboxItem>({
	items,
	selectedId,
	focusedId,
	onSelect,
	onFocusChange,
	optionIdPrefix,
	getOptionLabel,
	getOptionTooltip,
	listboxRef,
	ariaLabel = 'Runs',
}: RunsListboxProps<T>) {
	const fallbackRef = useRef<HTMLDivElement>(null);
	const ref = listboxRef ?? fallbackRef;

	return (
		<div
			ref={ref}
			role='listbox'
			aria-label={ariaLabel}
			tabIndex={0}
			aria-activedescendant={
				focusedId ? `${optionIdPrefix}${focusedId}` : undefined
			}
			className='min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400 rounded-md'
			onFocus={() => {
				if (items.length === 0) return;
				const inList = focusedId && items.some((r) => r.id === focusedId);
				if (!inList) {
					onFocusChange(
						selectedId && items.some((r) => r.id === selectedId)
							? selectedId
							: items[0]!.id,
					);
				}
			}}
			onKeyDown={(e) =>
				handleRunsListKeyDown(e, items, focusedId, onFocusChange, onSelect)
			}
		>
			<ul className='list-none space-y-1 min-w-0'>
				{items.map((item) => {
					const label = getOptionLabel(item);
					const isFocused = focusedId === item.id;
					const isSelected = selectedId === item.id;
					return (
						<li
							key={item.id}
							id={`${optionIdPrefix}${item.id}`}
							role='option'
							aria-selected={isSelected}
							className={`min-w-0 rounded-md ${isFocused && !isSelected ? 'ring-1 ring-zinc-300 ring-inset' : ''}`}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type='button'
										tabIndex={-1}
										variant={isSelected ? 'default' : 'ghost'}
										className='w-full min-w-0 justify-start overflow-hidden font-normal'
										onMouseDown={preventOptionFocus}
										onClick={() => onSelect(item.id)}
									>
										<span className='block min-w-0 truncate text-left text-[11px]'>
											{label}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent side='top'>
									<p>{getOptionTooltip ? getOptionTooltip(item) : label}</p>
								</TooltipContent>
							</Tooltip>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
