import React from 'react';
import {
	Button,
	Card,
	CardContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@aro/ui/components';
import { useInspectStore } from '../store';

export function WorkspaceCard() {
	const workspacePath = useInspectStore((s) => s.workspacePath);
	const selectWorkspace = useInspectStore((s) => s.selectWorkspace);

	return (
		<Card className='mb-0 py-2 px-4'>
			<CardContent className='p-0'>
				{!workspacePath ? (
					<div className='flex flex-wrap items-center gap-2'>
						<p className='text-sm text-zinc-500'>
							Select a workspace to configure sources and run Inspect.
						</p>
						<Button
							type='button'
							variant='secondary'
							size='xs'
							onClick={selectWorkspace}
						>
							Select workspace
						</Button>
					</div>
				) : (
					<div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
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
						<Button
							type='button'
							variant='ghost'
							size='xs'
							onClick={selectWorkspace}
						>
							Set workspace
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
