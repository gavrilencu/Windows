import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { APPS_REGISTRY } from '$lib/apps/registry';
import type { AppId, WindowFrame } from '$lib/system/types';
import {
	createWindowFromApp,
	nextZIndex,
	normalizeWindow,
	snapWindow,
	TASKBAR_RESERVED_HEIGHT,
	WORK_AREA_TOP
} from '$lib/system/windowManager';

export const windows = writable<WindowFrame[]>([]);
export const startMenuOpen = writable(false);
export const notificationCenterOpen = writable(false);
export const quickPanelOpen = writable(false);
export const calendarFlyoutOpen = writable(false);
export const volumeFlyoutOpen = writable(false);
export const networkFlyoutOpen = writable(false);
export const clipboardFlyoutOpen = writable(false);
export const peekedWindowId = writable<string | null>(null);
export const pinnedApps = writable<AppId[]>(['explorer', 'settings', 'notepad', 'terminal', 'browser', 'media', 'monitor']);
export const appLaunchCounts = writable<Record<AppId, number>>({
	explorer: 0,
	settings: 0,
	notepad: 0,
	terminal: 0,
	browser: 0,
	media: 0,
	monitor: 0
});

if (browser) {
	const pinsRaw = localStorage.getItem('win12-pinned-apps');
	const raw = localStorage.getItem('win12-launch-counts');
	if (pinsRaw) {
		try {
			const parsed = JSON.parse(pinsRaw) as AppId[];
			pinnedApps.set(parsed.filter((appId) => appId in APPS_REGISTRY));
		} catch {
			// ignore malformed localStorage values
		}
	}
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as Partial<Record<AppId, number>>;
			appLaunchCounts.update((current) => ({ ...current, ...parsed }));
		} catch {
			// ignore malformed localStorage values
		}
	}
	appLaunchCounts.subscribe((value) => {
		localStorage.setItem('win12-launch-counts', JSON.stringify(value));
	});
	pinnedApps.subscribe((value) => {
		localStorage.setItem('win12-pinned-apps', JSON.stringify(value));
	});
}

export function launchApp(appId: AppId, payload?: Record<string, unknown>): void {
	const app = APPS_REGISTRY[appId];
	if (!app) return;
	const existing = get(windows);
	const z = nextZIndex(existing);
	const win = createWindowFromApp(app, window.innerWidth, window.innerHeight, z);
	win.payload = payload;
	windows.update((list) => [...list.map((w) => ({ ...w, focused: false })), win]);
	appLaunchCounts.update((counts) => ({ ...counts, [appId]: (counts[appId] ?? 0) + 1 }));
	startMenuOpen.set(false);
	notificationCenterOpen.set(false);
}

export function focusWindow(id: string): void {
	windows.update((list) => {
		const z = nextZIndex(list);
		return list.map((w) => (w.id === id ? { ...w, focused: true, minimized: false, zIndex: z } : { ...w, focused: false }));
	});
}

export function closeWindow(id: string): void {
	windows.update((list) => list.filter((w) => w.id !== id));
}

export function minimizeWindow(id: string): void {
	windows.update((list) => list.map((w) => (w.id === id ? { ...w, minimized: true, focused: false } : w)));
}

export function maximizeWindow(id: string): void {
	windows.update((list) =>
		list.map((w) =>
			w.id === id
				? {
						...w,
						maximized: !w.maximized,
						snapped: undefined,
						x: w.maximized ? (w.restoreBounds?.x ?? w.x) : 0,
						y: w.maximized ? (w.restoreBounds?.y ?? w.y) : WORK_AREA_TOP,
						width: w.maximized ? (w.restoreBounds?.width ?? w.width) : window.innerWidth,
						height: w.maximized
							? (w.restoreBounds?.height ?? w.height)
							: Math.max(220, window.innerHeight - WORK_AREA_TOP - TASKBAR_RESERVED_HEIGHT),
						restoreBounds: w.maximized
							? undefined
							: {
									x: w.x,
									y: w.y,
									width: w.width,
									height: w.height
								}
					}
				: w
		)
	);
}

export function updateWindowGeometry(id: string, partial: Partial<WindowFrame>): void {
	windows.update((list) =>
		list.map((w) => {
			if (w.id !== id) return w;
			const updated = normalizeWindow({ ...w, ...partial }, window.innerWidth, window.innerHeight);
			return updated;
		})
	);
}

export function snapWindowLayout(id: string, snap: WindowFrame['snapped']): void {
	windows.update((list) =>
		list.map((w) =>
			w.id === id
				? snapWindow(
						{
							...w,
							restoreBounds: w.restoreBounds ?? { x: w.x, y: w.y, width: w.width, height: w.height }
						},
						snap,
						window.innerWidth,
						window.innerHeight
					)
				: w
		)
	);
}

export function restoreApp(appId: AppId): void {
	windows.update((list) => {
		const target = list.find((w) => w.appId === appId);
		if (!target) return list;
		const z = nextZIndex(list);
		return list.map((w) =>
			w.id === target.id ? { ...w, minimized: false, focused: true, zIndex: z } : { ...w, focused: false }
		);
	});
}

export function toggleStartMenu(): void {
	startMenuOpen.update((v) => {
		const next = !v;
		if (next) {
			notificationCenterOpen.set(false);
			quickPanelOpen.set(false);
			calendarFlyoutOpen.set(false);
			volumeFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function toggleNotificationCenter(): void {
	notificationCenterOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			quickPanelOpen.set(false);
			calendarFlyoutOpen.set(false);
			volumeFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function closeOverlays(): void {
	startMenuOpen.set(false);
	notificationCenterOpen.set(false);
	quickPanelOpen.set(false);
	calendarFlyoutOpen.set(false);
	volumeFlyoutOpen.set(false);
	networkFlyoutOpen.set(false);
	clipboardFlyoutOpen.set(false);
	peekedWindowId.set(null);
}

export function toggleQuickPanel(): void {
	quickPanelOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			notificationCenterOpen.set(false);
			calendarFlyoutOpen.set(false);
			volumeFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function focusNextWindow(): void {
	windows.update((list) => {
		const active = list.filter((w) => !w.minimized).sort((a, b) => b.zIndex - a.zIndex);
		if (active.length < 2) return list;
		const next = active[1];
		const z = nextZIndex(list);
		return list.map((w) => (w.id === next.id ? { ...w, focused: true, zIndex: z } : { ...w, focused: false }));
	});
}

export function toggleTaskbarApp(appId: AppId): void {
	const list = get(windows);
	const appWindows = list.filter((w) => w.appId === appId).sort((a, b) => b.zIndex - a.zIndex);
	if (!appWindows.length) {
		launchApp(appId);
		return;
	}

	const top = appWindows[0];
	if (top.focused && !top.minimized) {
		minimizeWindow(top.id);
		return;
	}
	restoreApp(appId);
}

export function closeAppGroup(appId: AppId): void {
	windows.update((list) => list.filter((w) => w.appId !== appId));
}

export function setPeekWindow(id: string | null): void {
	peekedWindowId.set(id);
}

export function reorderPinnedApps(draggedId: AppId, targetId: AppId): void {
	if (draggedId === targetId) return;
	pinnedApps.update((items) => {
		const from = items.indexOf(draggedId);
		const to = items.indexOf(targetId);
		if (from === -1 || to === -1) return items;
		const next = [...items];
		next.splice(from, 1);
		next.splice(to, 0, draggedId);
		return next;
	});
}

export function getFocusedWindowId(): string | null {
	const focused = [...get(windows)].sort((a, b) => b.zIndex - a.zIndex).find((w) => w.focused && !w.minimized);
	return focused?.id ?? null;
}

export function closeFocusedWindow(): void {
	const id = getFocusedWindowId();
	if (!id) return;
	closeWindow(id);
}

export function maximizeFocusedWindow(): void {
	const id = getFocusedWindowId();
	if (!id) return;
	const focused = get(windows).find((w) => w.id === id);
	if (!focused || focused.maximized) return;
	maximizeWindow(id);
}

export function minimizeFocusedWindow(): void {
	const id = getFocusedWindowId();
	if (!id) return;
	minimizeWindow(id);
}

export function toggleCalendarFlyout(): void {
	calendarFlyoutOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			notificationCenterOpen.set(false);
			quickPanelOpen.set(false);
			volumeFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function toggleVolumeFlyout(): void {
	volumeFlyoutOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			notificationCenterOpen.set(false);
			quickPanelOpen.set(false);
			calendarFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function toggleNetworkFlyout(): void {
	networkFlyoutOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			notificationCenterOpen.set(false);
			quickPanelOpen.set(false);
			calendarFlyoutOpen.set(false);
			volumeFlyoutOpen.set(false);
			clipboardFlyoutOpen.set(false);
		}
		return next;
	});
}

export function toggleClipboardFlyout(): void {
	clipboardFlyoutOpen.update((v) => {
		const next = !v;
		if (next) {
			startMenuOpen.set(false);
			notificationCenterOpen.set(false);
			quickPanelOpen.set(false);
			calendarFlyoutOpen.set(false);
			volumeFlyoutOpen.set(false);
			networkFlyoutOpen.set(false);
		}
		return next;
	});
}
