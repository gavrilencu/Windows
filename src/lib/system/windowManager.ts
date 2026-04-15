import type { AppDefinition, AppId, WindowFrame } from '$lib/system/types';

export const WORK_AREA_TOP = 0;
export const TASKBAR_RESERVED_HEIGHT = 62;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function createWindowFromApp(
	app: AppDefinition,
	viewportWidth: number,
	viewportHeight: number,
	nextZ: number
): WindowFrame {
	const width = clamp(app.defaultWidth, app.minWidth, Math.max(app.minWidth, viewportWidth - 80));
	const height = clamp(app.defaultHeight, app.minHeight, Math.max(app.minHeight, viewportHeight - 120));
	const x = Math.max(24, Math.round((viewportWidth - width) / 2 + Math.random() * 40 - 20));
	const y = Math.max(24, Math.round((viewportHeight - height) / 2 + Math.random() * 40 - 20));

	return {
		id: `win-${app.id}-${crypto.randomUUID()}`,
		appId: app.id,
		title: app.name,
		x,
		y,
		width,
		height,
		zIndex: nextZ,
		minimized: false,
		maximized: false,
		focused: true
	};
}

export function nextZIndex(windows: WindowFrame[]): number {
	return windows.reduce((max, w) => Math.max(max, w.zIndex), 0) + 1;
}

export function snapWindow(window: WindowFrame, snap: WindowFrame['snapped'], vw: number, vh: number): WindowFrame {
	const workY = WORK_AREA_TOP;
	const workHeight = Math.max(220, vh - WORK_AREA_TOP - TASKBAR_RESERVED_HEIGHT);
	const halfW = Math.floor(vw / 2);
	const halfH = Math.floor(workHeight / 2);

	switch (snap) {
		case 'left':
			return { ...window, snapped: 'left', maximized: false, x: 0, y: workY, width: halfW, height: workHeight };
		case 'right':
			return {
				...window,
				snapped: 'right',
				maximized: false,
				x: halfW,
				y: workY,
				width: vw - halfW,
				height: workHeight
			};
		case 'top-left':
			return { ...window, snapped: 'top-left', maximized: false, x: 0, y: workY, width: halfW, height: halfH };
		case 'top-right':
			return {
				...window,
				snapped: 'top-right',
				maximized: false,
				x: halfW,
				y: workY,
				width: vw - halfW,
				height: halfH
			};
		case 'bottom-left':
			return {
				...window,
				snapped: 'bottom-left',
				maximized: false,
				x: 0,
				y: workY + halfH,
				width: halfW,
				height: workHeight - halfH
			};
		case 'bottom-right':
			return {
				...window,
				snapped: 'bottom-right',
				maximized: false,
				x: halfW,
				y: workY + halfH,
				width: vw - halfW,
				height: workHeight - halfH
			};
		default:
			return window;
	}
}

export function normalizeWindow(window: WindowFrame, vw: number, vh: number): WindowFrame {
	const width = clamp(window.width, 320, vw);
	const height = clamp(window.height, 220, vh - 40);
	return {
		...window,
		width,
		height,
		x: clamp(window.x, 0, Math.max(0, vw - width)),
		y: clamp(window.y, 0, Math.max(0, vh - height))
	};
}

export function appOpenCount(windows: WindowFrame[], appId: AppId): number {
	return windows.filter((w) => w.appId === appId && !w.minimized).length;
}
