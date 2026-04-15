import type { AppDefinition, AppId } from '$lib/system/types';

export const APP_LIST: AppDefinition[] = [
	{
		id: 'explorer',
		name: 'File Explorer',
		description: 'Browse virtual files and folders',
		icon: 'Folders',
		componentPath: '$lib/apps/explorer/App.svelte',
		defaultWidth: 980,
		defaultHeight: 640,
		minWidth: 640,
		minHeight: 400
	},
	{
		id: 'settings',
		name: 'Settings',
		description: 'Theme, wallpaper and system preferences',
		icon: 'Settings',
		componentPath: '$lib/apps/settings/App.svelte',
		defaultWidth: 880,
		defaultHeight: 620,
		minWidth: 600,
		minHeight: 400
	},
	{
		id: 'notepad',
		name: 'Notepad',
		description: 'Simple text editor with autosave',
		icon: 'FileText',
		componentPath: '$lib/apps/notepad/App.svelte',
		defaultWidth: 840,
		defaultHeight: 560,
		minWidth: 520,
		minHeight: 340
	},
	{
		id: 'terminal',
		name: 'Terminal',
		description: 'Interactive fake shell',
		icon: 'Terminal',
		componentPath: '$lib/apps/terminal/App.svelte',
		defaultWidth: 860,
		defaultHeight: 520,
		minWidth: 560,
		minHeight: 340
	},
	{
		id: 'browser',
		name: 'Browser',
		description: 'Sandbox iframe web view',
		icon: 'Globe',
		componentPath: '$lib/apps/browser/App.svelte',
		defaultWidth: 1020,
		defaultHeight: 700,
		minWidth: 640,
		minHeight: 420
	},
	{
		id: 'media',
		name: 'Media Player',
		description: 'Basic local media playback',
		icon: 'CirclePlay',
		componentPath: '$lib/apps/media/App.svelte',
		defaultWidth: 760,
		defaultHeight: 540,
		minWidth: 460,
		minHeight: 320
	},
	{
		id: 'monitor',
		name: 'System Monitor',
		description: 'Live CPU/RAM mock and process list',
		icon: 'Activity',
		componentPath: '$lib/apps/monitor/App.svelte',
		defaultWidth: 920,
		defaultHeight: 620,
		minWidth: 640,
		minHeight: 420
	}
];

export const APPS_REGISTRY: Record<AppId, AppDefinition> = Object.fromEntries(
	APP_LIST.map((app) => [app.id, app])
) as Record<AppId, AppDefinition>;

export const APP_COMPONENTS = {
	explorer: () => import('$lib/apps/explorer/App.svelte'),
	settings: () => import('$lib/apps/settings/App.svelte'),
	notepad: () => import('$lib/apps/notepad/App.svelte'),
	terminal: () => import('$lib/apps/terminal/App.svelte'),
	browser: () => import('$lib/apps/browser/App.svelte'),
	media: () => import('$lib/apps/media/App.svelte'),
	monitor: () => import('$lib/apps/monitor/App.svelte')
};
