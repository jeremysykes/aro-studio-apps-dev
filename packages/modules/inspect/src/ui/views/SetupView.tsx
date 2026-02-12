import React from 'react';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Textarea,
} from '@aro/desktop/components';
import type { ScanConfig } from '../types';

export interface SetupViewProps {
	config: ScanConfig;
	onConfigChange: React.Dispatch<React.SetStateAction<ScanConfig>>;
	onRunScan: () => void;
	hasAtLeastOneSource: boolean;
}

export function SetupView({
	config,
	onConfigChange,
	onRunScan,
	hasAtLeastOneSource,
}: SetupViewProps) {
	return (
		<section aria-labelledby="setup-heading">
			<h2 id="setup-heading" className="sr-only">
				Setup sources
			</h2>
			<div className="grid grid-cols-1 min-[900px]:grid-cols-3 gap-4 mb-4">
				<Card>
					<CardHeader>
						<CardTitle>Figma</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<label
							htmlFor="setup-figma-file-keys"
							className="block text-sm font-medium"
						>
							File key(s) or URL(s){' '}
							<span className="text-muted-foreground">
								(comma-separated)
							</span>
						</label>
						<Input
							id="setup-figma-file-keys"
							type="text"
							value={config.figmaFileKeys}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									figmaFileKeys: e.target.value,
								}))
							}
							placeholder="abc123def456 or Figma URL"
							aria-label="Figma file keys or URLs"
						/>
						<label
							htmlFor="setup-figma-pat"
							className="block text-sm font-medium"
						>
							Personal access token
						</label>
						<Input
							id="setup-figma-pat"
							type="password"
							value={config.figmaPat}
							onChange={(e) =>
								onConfigChange((c) => ({ ...c, figmaPat: e.target.value }))
							}
							placeholder="figd_…"
							aria-label="Figma PAT"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Code tokens</CardTitle>
					</CardHeader>
					<CardContent>
						<label
							htmlFor="setup-code-paths"
							className="block text-sm font-medium mb-1"
						>
							Path(s) to token files (one per line or comma-separated), or paste
							raw DTCG/Style Dictionary JSON
						</label>
						<Textarea
							id="setup-code-paths"
							value={config.codePaths}
							onChange={(e) =>
								onConfigChange((c) => ({ ...c, codePaths: e.target.value }))
							}
							placeholder="tokens/tokens.json or paste JSON"
							aria-label="Code token paths or inline JSON"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Storybook</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<label
							htmlFor="setup-storybook-url"
							className="block text-sm font-medium"
						>
							Index URL
						</label>
						<Input
							id="setup-storybook-url"
							type="url"
							value={config.storybookUrl}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									storybookUrl: e.target.value,
								}))
							}
							placeholder="Base URL (e.g. https://site.vercel.app/) or …/index.json"
							aria-label="Storybook index URL"
						/>
						<span className="text-sm text-muted-foreground">
							or workspace path to index
						</span>
						<label
							htmlFor="setup-storybook-path"
							className="sr-only"
						>
							Storybook index path
						</label>
						<Input
							id="setup-storybook-path"
							type="text"
							value={config.storybookPath}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									storybookPath: e.target.value,
								}))
							}
							placeholder="storybook-static/index.json"
							aria-label="Storybook index path"
						/>
					</CardContent>
				</Card>
			</div>
			<Button
				type="button"
				disabled={!hasAtLeastOneSource}
				onClick={onRunScan}
			>
				Run Inspect
			</Button>
		</section>
	);
}
