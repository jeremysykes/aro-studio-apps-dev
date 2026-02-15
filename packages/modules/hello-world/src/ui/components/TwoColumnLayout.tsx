import React from 'react';

const GRID_BASE =
	'grid grid-cols-1 min-[900px]:grid-rows-[minmax(0,1fr)] min-[900px]:max-h-[calc(100vh-10rem)] min-[900px]:min-h-0 gap-4';
const GRID_SIDEBAR_LEFT = 'min-[900px]:grid-cols-[20rem_1fr]';
const GRID_SIDEBAR_RIGHT = 'min-[900px]:grid-cols-[1fr_20rem]';
const SIDEBAR_CLASS = 'min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0';
const CARD_CLASS =
	'min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden';
const CARD_CONTENT_CLASS =
	'min-[900px]:overflow-auto min-[900px]:min-h-0 min-w-0';
const COLUMN_HEADER_CLASS =
	'flex min-h-[4rem] shrink-0 items-center border-b border-zinc-200 px-4 py-3';

export interface TwoColumnLayoutProps {
	sidebar: React.ReactNode;
	main: React.ReactNode;
	sidebarAside?: boolean;
	/** When true, runs column appears on the right (default: left). */
	sidebarRight?: boolean;
}

export function TwoColumnLayout({
	sidebar,
	main,
	sidebarAside = false,
	sidebarRight = false,
}: TwoColumnLayoutProps) {
	const SidebarWrapper = sidebarAside ? 'aside' : 'div';
	const gridClass = `${GRID_BASE} ${sidebarRight ? GRID_SIDEBAR_RIGHT : GRID_SIDEBAR_LEFT}`;
	const mainCol = (
		<div className="min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:min-w-0">
			{main}
		</div>
	);
	const sidebarCol = (
		<SidebarWrapper
			aria-label={sidebarAside ? 'Run selection' : undefined}
			className={SIDEBAR_CLASS}
		>
			{sidebar}
		</SidebarWrapper>
	);
	return (
		<div className={gridClass}>
			{sidebarRight ? (
				<>
					{mainCol}
					{sidebarCol}
				</>
			) : (
				<>
					{sidebarCol}
					{mainCol}
				</>
			)}
		</div>
	);
}

export { CARD_CLASS, CARD_CONTENT_CLASS, COLUMN_HEADER_CLASS };
