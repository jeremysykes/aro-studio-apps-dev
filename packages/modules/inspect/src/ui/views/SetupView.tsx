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
		<section aria-labelledby='setup-heading'>
			<h2 id='setup-heading' className='sr-only'>
				Setup sources
			</h2>
			<div className='grid grid-cols-1 min-[900px]:grid-cols-3 gap-4 mb-4'>
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Figma</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2'>
						<label
							htmlFor='setup-figma-file-keys'
							className='block text-[11px] font-medium'
						>
							File key(s) or URL(s) (comma-separated)
						</label>
						<Input
							id='setup-figma-file-keys'
							type='text'
							className='text-[11px]'
							value={config.figmaFileKeys}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									figmaFileKeys: e.target.value,
								}))
							}
							placeholder='abc123def456 or Figma URL'
							aria-label='Figma file keys or URLs'
						/>
						<label
							htmlFor='setup-figma-pat'
							className='block text-sm font-medium'
						>
							Personal access token
						</label>
						<Input
							id='setup-figma-pat'
							type='password'
							className='text-[11px]'
							value={config.figmaPat}
							onChange={(e) =>
								onConfigChange((c) => ({ ...c, figmaPat: e.target.value }))
							}
							placeholder='figd_…'
							aria-label='Figma PAT'
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Code tokens</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2'>
						<p className='text-[11px] text-muted-foreground'>
							Add your design tokens here. You can either list the path to each
							token file (one per line or separated by commas), or paste JSON
							from DTCG or Style Dictionary directly into the box below.
						</p>
						<label
							htmlFor='setup-code-paths'
							className='block text-sm font-medium'
						>
							Paths or JSON
						</label>
						<Textarea
							id='setup-code-paths'
							className='text-[11px]'
							value={config.codePaths}
							onChange={(e) =>
								onConfigChange((c) => ({ ...c, codePaths: e.target.value }))
							}
							placeholder='tokens/tokens.json or paste JSON'
							aria-label='Code token paths or inline JSON'
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className='text-base'>Storybook</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2'>
						<label
							htmlFor='setup-storybook-url'
							className='block text-[11px] font-medium'
						>
							Index URL
						</label>
						<Input
							id='setup-storybook-url'
							type='url'
							className='text-[11px]'
							value={config.storybookUrl}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									storybookUrl: e.target.value,
								}))
							}
							placeholder='Base URL (e.g. https://site.vercel.app/index.json)'
							aria-label='Storybook index URL'
						/>
						<span className='text-[11px] text-muted-foreground'>
							or workspace path to index
						</span>
						<label htmlFor='setup-storybook-path' className='sr-only'>
							Storybook index path
						</label>
						<Input
							id='setup-storybook-path'
							type='text'
							className='text-[11px]'
							value={config.storybookPath}
							onChange={(e) =>
								onConfigChange((c) => ({
									...c,
									storybookPath: e.target.value,
								}))
							}
							placeholder='storybook-static/index.json'
							aria-label='Storybook index path'
						/>
					</CardContent>
				</Card>
			</div>
			<Button
				type='button'
				variant='outline'
				size='xs'
				disabled={!hasAtLeastOneSource}
				onClick={onRunScan}
			>
				Run Inspect
			</Button>
		</section>
	);
}
