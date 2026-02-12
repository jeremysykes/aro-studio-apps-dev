import React from 'react';

const GRID_CLASS =
	'grid grid-cols-1 min-[900px]:grid-cols-[20rem_1fr] min-[900px]:grid-rows-[minmax(0,1fr)] min-[900px]:max-h-[calc(100vh-12rem)] min-[900px]:min-h-0 gap-4';
const SIDEBAR_CLASS = 'min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0';
const CARD_CLASS =
	'min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden';
const CARD_CONTENT_CLASS =
	'min-[900px]:overflow-y-auto min-[900px]:min-h-0 min-w-0';

export interface TwoColumnLayoutProps {
	sidebar: React.ReactNode;
	main: React.ReactNode;
	sidebarAside?: boolean;
}

export function TwoColumnLayout({
	sidebar,
	main,
	sidebarAside = false,
}: TwoColumnLayoutProps) {
	const SidebarWrapper = sidebarAside ? 'aside' : 'div';
	return (
		<div className={GRID_CLASS}>
			<SidebarWrapper
				aria-label={sidebarAside ? 'Run selection' : undefined}
				className={SIDEBAR_CLASS}
			>
				{sidebar}
			</SidebarWrapper>
			<div className="min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:min-w-0">
				{main}
			</div>
		</div>
	);
}

export { CARD_CLASS, CARD_CONTENT_CLASS };
