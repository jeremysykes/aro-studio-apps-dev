import React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@aro/desktop/components';

export interface WorkspaceCardProps {
	workspacePath: string | null;
	onSelectWorkspace: () => void;
}

export function WorkspaceCard({
	workspacePath,
	onSelectWorkspace,
}: WorkspaceCardProps) {
	return (
		<Card className="mb-4">
			<CardHeader>
				<CardTitle>Workspace</CardTitle>
			</CardHeader>
			<CardContent>
				{!workspacePath ? (
					<>
						<p className="mb-2 text-muted-foreground">
							Select a workspace to configure sources and run Inspect.
						</p>
						<Button type="button" onClick={onSelectWorkspace}>
							Select workspace
						</Button>
					</>
				) : (
					<>
						<p className="mb-2 text-sm">
							<strong>Path:</strong> {workspacePath}
						</p>
						<Button
							type="button"
							variant="outline"
							onClick={onSelectWorkspace}
						>
							Change workspace
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	);
}
