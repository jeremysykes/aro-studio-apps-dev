import React from 'react';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Textarea,
} from '@aro/ui/components';
import { useInspectStore } from '../store';

export interface SetupViewProps {
	hasAtLeastOneSource: boolean;
	hasWorkspace: boolean;
}

/** Derive which sources are configured from the current config. */
function configuredSources(config: {
	figmaFileKeys: string;
	figmaPat: string;
	codePaths: string;
	storybookUrl: string;
	storybookPath: string;
}): string[] {
	const sources: string[] = [];
	if (config.figmaFileKeys.trim() && config.figmaPat.trim())
		sources.push('Figma');
	if (config.codePaths.trim()) sources.push('Code tokens');
	if (config.storybookUrl.trim() || config.storybookPath.trim())
		sources.push('Storybook');
	return sources;
}

export function SetupView({ hasAtLeastOneSource, hasWorkspace }: SetupViewProps) {
	const config = useInspectStore((s) => s.config);
	const setConfig = useInspectStore((s) => s.setConfig);
	const runScan = useInspectStore((s) => s.runScan);

	const sources = configuredSources(config);
	const figmaConfigured = sources.includes('Figma');
	const codeConfigured = sources.includes('Code tokens');
	const storybookConfigured = sources.includes('Storybook');

	return (
		<section aria-labelledby='setup-heading'>
			<h2 id='setup-heading' className='sr-only'>
				Setup sources
			</h2>

			{/* Primary CTA — always visible without scrolling */}
			<div className='flex items-center gap-3 mb-4'>
				<Button
					type='button'
					variant='default'
					size='sm'
					disabled={!hasWorkspace || !hasAtLeastOneSource}
					onClick={runScan}
				>
					Run Inspect
				</Button>
				{hasAtLeastOneSource ? (
					<span className='text-xs text-zinc-500'>
						Will scan: {sources.join(', ')}
					</span>
				) : (
					<span className='text-xs text-zinc-500'>
						Configure at least one source below to enable.
					</span>
				)}
			</div>

			<div className='grid grid-cols-1 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 gap-4'>
				{/* ── Figma ── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-base'>Figma</CardTitle>
							{figmaConfigured ? (
								<Badge variant='secondary'>&#10003; Configured</Badge>
							) : (
								<span className='text-zinc-400 text-xs'>Not configured</span>
							)}
						</div>
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
								setConfig((c) => ({
									...c,
									figmaFileKeys: e.target.value,
								}))
							}
							placeholder='abc123def456 or Figma URL'
							aria-label='Figma file keys or URLs'
						/>
						<label
							htmlFor='setup-figma-pat'
							className='block text-[11px] font-medium'
						>
							Personal access token
						</label>
						<Input
							id='setup-figma-pat'
							type='password'
							className='text-[11px]'
							value={config.figmaPat}
							onChange={(e) =>
								setConfig((c) => ({ ...c, figmaPat: e.target.value }))
							}
							placeholder='figd_…'
							aria-label='Figma PAT'
						/>
					</CardContent>
				</Card>

				{/* ── Code tokens ── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-base'>Code tokens</CardTitle>
							{codeConfigured ? (
								<Badge variant='secondary'>&#10003; Configured</Badge>
							) : (
								<span className='text-zinc-400 text-xs'>Not configured</span>
							)}
						</div>
					</CardHeader>
					<CardContent className='space-y-2'>
						<p className='text-[11px] text-zinc-500'>
							Add your design tokens here. You can either list the path to each
							token file (one per line or separated by commas), or paste JSON
							from DTCG or Style Dictionary directly into the box below.
						</p>
						<label
							htmlFor='setup-code-paths'
							className='block text-[11px] font-medium'
						>
							Paths or JSON
						</label>
						<Textarea
							id='setup-code-paths'
							className='text-[11px]'
							value={config.codePaths}
							onChange={(e) =>
								setConfig((c) => ({ ...c, codePaths: e.target.value }))
							}
							placeholder='tokens/tokens.json or paste JSON'
							aria-label='Code token paths or inline JSON'
						/>
					</CardContent>
				</Card>

				{/* ── Storybook ── */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-base'>Storybook</CardTitle>
							{storybookConfigured ? (
								<Badge variant='secondary'>&#10003; Configured</Badge>
							) : (
								<span className='text-zinc-400 text-xs'>Not configured</span>
							)}
						</div>
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
								setConfig((c) => ({
									...c,
									storybookUrl: e.target.value,
								}))
							}
							placeholder='Base URL (e.g. https://site.vercel.app/index.json)'
							aria-label='Storybook index URL'
						/>
						<span className='text-[11px] text-zinc-500'>
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
								setConfig((c) => ({
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

		</section>
	);
}
