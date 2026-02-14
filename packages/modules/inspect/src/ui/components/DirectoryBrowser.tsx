import React, { useEffect, useState, useCallback } from 'react';
import { Button, Input } from '@aro/ui/components';
import type { BrowseResult } from '@aro/types';

export interface DirectoryBrowserProps {
	initialPath?: string;
	onSelect: (path: string) => void;
	onCancel: () => void;
	browse: (path?: string) => Promise<BrowseResult>;
}

export function DirectoryBrowser({ initialPath, onSelect, onCancel, browse }: DirectoryBrowserProps) {
	const [result, setResult] = useState<BrowseResult | null>(null);
	const [pathInput, setPathInput] = useState(initialPath ?? '');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const navigateTo = useCallback(
		async (dirPath?: string) => {
			setLoading(true);
			setError(null);
			try {
				const data = await browse(dirPath);
				setResult(data);
				setPathInput(data.current);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to browse directory');
			} finally {
				setLoading(false);
			}
		},
		[browse],
	);

	useEffect(() => {
		navigateTo(initialPath);
	}, [initialPath, navigateTo]);

	const handlePathSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (pathInput.trim()) {
			navigateTo(pathInput.trim());
		}
	};

	return (
		<div className='flex flex-col gap-3'>
			<form onSubmit={handlePathSubmit} className='flex gap-2'>
				<Input
					value={pathInput}
					onChange={(e) => setPathInput(e.target.value)}
					placeholder='/path/to/workspace'
					className='flex-1 font-mono text-xs'
				/>
				<Button type='submit' variant='secondary' size='xs'>
					Go
				</Button>
			</form>

			{error && (
				<p className='text-xs text-red-500'>{error}</p>
			)}

			<div className='border border-zinc-200 rounded-lg overflow-hidden'>
				<div className='max-h-[320px] overflow-y-auto'>
					{loading ? (
						<div className='p-4 text-center text-xs text-zinc-400'>Loading...</div>
					) : result ? (
						<div className='divide-y divide-zinc-100'>
							{result.parent && (
								<button
									type='button'
									className='w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 text-left'
									onClick={() => navigateTo(result.parent!)}
								>
									<span className='text-zinc-400'>&#8593;</span>
									<span className='text-zinc-500'>..</span>
								</button>
							)}
							{result.entries.length === 0 && (
								<div className='p-4 text-center text-xs text-zinc-400'>
									No subdirectories
								</div>
							)}
							{result.entries.map((entry) => (
								<button
									key={entry.path}
									type='button'
									className='w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 text-left'
									onClick={() => navigateTo(entry.path)}
								>
									<span className='text-zinc-400'>&#128193;</span>
									<span className='truncate'>{entry.name}</span>
								</button>
							))}
						</div>
					) : null}
				</div>
			</div>

			{result && (
				<p className='text-[11px] text-zinc-400 truncate' title={result.current}>
					{result.current}
				</p>
			)}

			<div className='flex justify-end gap-2'>
				<Button type='button' variant='ghost' size='xs' onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type='button'
					size='xs'
					disabled={!result}
					onClick={() => result && onSelect(result.current)}
				>
					Select this directory
				</Button>
			</div>
		</div>
	);
}
