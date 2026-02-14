import React, { useState } from 'react';
import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@aro/ui/components';
import { useInspectStore } from '../store';
import { DirectoryBrowser } from './DirectoryBrowser';

type AroExt = {
	workspace: { set?: (p: string) => Promise<{ path: string }> };
	filesystem?: {
		browse: (p?: string) => Promise<import('@aro/types').BrowseResult>;
	};
};

/** Check whether the web-only filesystem API is available. */
const hasFilesystemApi = () =>
	typeof window !== 'undefined' &&
	window.aro &&
	'filesystem' in (window.aro as unknown as AroExt);

export function WorkspaceCard() {
	const workspacePath = useInspectStore((s) => s.workspacePath);
	const selectWorkspace = useInspectStore((s) => s.selectWorkspace);
	const setWorkspacePath = useInspectStore((s) => s._setWorkspacePath);
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleClick = () => {
		if (hasFilesystemApi()) {
			setDialogOpen(true);
		} else {
			selectWorkspace();
		}
	};

	const handleSelect = async (dirPath: string) => {
		const ext = window.aro as unknown as AroExt;
		if (ext.workspace.set) {
			const result = await ext.workspace.set(dirPath);
			setWorkspacePath(result.path);
		}
		setDialogOpen(false);
	};

	const browse = (dirPath?: string) => {
		const ext = window.aro as unknown as AroExt;
		return ext.filesystem!.browse(dirPath);
	};

	return (
		<>
			<Card className='mb-0 py-1.5 px-3'>
				<CardContent className='p-0'>
					{!workspacePath ? (
						<div className='flex flex-wrap items-center gap-2'>
							<Button
								type='button'
								variant='secondary'
								size='xs'
								onClick={handleClick}
							>
								Select workspace
							</Button>
							<p className='text-sm text-zinc-500'>
								Select a workspace to configure sources and run Inspect.
							</p>
						</div>
					) : (
						<div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
							<Button
								type='button'
								variant='ghost'
								size='xs'
								onClick={handleClick}
							>
								Set workspace
							</Button>
							<span className='text-sm text-zinc-500 min-w-0 flex items-baseline gap-1'>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className='truncate text-[11px] cursor-default'>
											{workspacePath}
										</span>
									</TooltipTrigger>
									<TooltipContent>{workspacePath}</TooltipContent>
								</Tooltip>
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='max-w-lg'>
					<DialogHeader>
						<DialogTitle>Select workspace</DialogTitle>
						<DialogDescription>
							Browse and select a directory on the server to use as your
							workspace.
						</DialogDescription>
					</DialogHeader>
					<DirectoryBrowser
						initialPath={workspacePath ?? undefined}
						onSelect={handleSelect}
						onCancel={() => setDialogOpen(false)}
						browse={browse}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
