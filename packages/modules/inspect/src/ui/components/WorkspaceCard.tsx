import React from 'react';
import { Button, Card, CardContent } from '@aro/desktop/components';

export interface WorkspaceCardProps {
	workspacePath: string | null;
	onSelectWorkspace: () => void;
}

export function WorkspaceCard({
	workspacePath,
	onSelectWorkspace,
}: WorkspaceCardProps) {
	return (
		<Card className='mb-0 py-2 px-4'>
			<CardContent className='p-0'>
				{!workspacePath ? (
					<div className='flex flex-wrap items-center gap-2'>
						<p className='text-sm text-muted-foreground'>
							Select a workspace to configure sources and run Inspect.
						</p>
						<Button
							type='button'
							variant='secondary'
							size='xs'
							onClick={onSelectWorkspace}
						>
							Select workspace
						</Button>
					</div>
				) : (
					<div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
						<span className='text-sm text-muted-foreground min-w-0 flex items-baseline gap-1'>
							<span className='truncate text-[11px]' title={workspacePath}>
								{workspacePath}
							</span>
						</span>
						<Button
							type='button'
							variant='ghost'
							size='xs'
							onClick={onSelectWorkspace}
						>
							Set workspace
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
