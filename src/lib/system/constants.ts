import type { DesktopIcon, SystemPreferences, VirtualFolder } from '$lib/system/types';
import { WALLPAPER_PRESETS } from '$lib/system/wallpapers';

export const ROOT_FOLDER_ID = 'root';
export const DESKTOP_FOLDER_ID = 'desktop';
export const DOCUMENTS_FOLDER_ID = 'documents';
export const MEDIA_FOLDER_ID = 'media';
export const RECYCLE_FOLDER_ID = 'recycle';

export const DEFAULT_PREFERENCES: SystemPreferences = {
	theme: 'dark',
	wallpaper: WALLPAPER_PRESETS[0].url,
	lockscreenWallpaper: WALLPAPER_PRESETS[1].url,
	accentColor: '#5b9cff'
};

const now = Date.now();

export const ROOT_FOLDERS: VirtualFolder[] = [
	{ id: ROOT_FOLDER_ID, type: 'folder', name: 'This PC', parentId: null, createdAt: now, updatedAt: now },
	{
		id: DESKTOP_FOLDER_ID,
		type: 'folder',
		name: 'Desktop',
		parentId: ROOT_FOLDER_ID,
		createdAt: now,
		updatedAt: now
	},
	{
		id: DOCUMENTS_FOLDER_ID,
		type: 'folder',
		name: 'Documents',
		parentId: ROOT_FOLDER_ID,
		createdAt: now,
		updatedAt: now
	},
	{
		id: MEDIA_FOLDER_ID,
		type: 'folder',
		name: 'Media',
		parentId: ROOT_FOLDER_ID,
		createdAt: now,
		updatedAt: now
	},
	{
		id: RECYCLE_FOLDER_ID,
		type: 'folder',
		name: 'Recycle Bin',
		parentId: ROOT_FOLDER_ID,
		createdAt: now,
		updatedAt: now
	}
];

export const DEFAULT_DESKTOP_ICONS: DesktopIcon[] = [
	{ id: 'icon-explorer', title: 'File Explorer', appId: 'explorer', x: 24, y: 28 },
	{ id: 'icon-settings', title: 'Settings', appId: 'settings', x: 24, y: 126 },
	{ id: 'icon-notepad', title: 'Notepad', appId: 'notepad', x: 24, y: 224 },
	{ id: 'icon-browser', title: 'Browser', appId: 'browser', x: 24, y: 322 },
	{ id: 'icon-terminal', title: 'Terminal', appId: 'terminal', x: 24, y: 420 },
	{ id: 'icon-monitor', title: 'System Monitor', appId: 'monitor', x: 24, y: 518 },
	{ id: 'icon-recycle', title: 'Recycle Bin', fileId: RECYCLE_FOLDER_ID, x: 24, y: 616 }
];
