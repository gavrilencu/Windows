import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { AppId, RecentFileActivity } from '$lib/system/types';

const STORAGE_KEY = 'win12-recent-files';

export const recentFiles = writable<RecentFileActivity[]>([]);

if (browser) {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) {
		try {
			recentFiles.set(JSON.parse(raw) as RecentFileActivity[]);
		} catch {
			// ignore malformed cache
		}
	}
	recentFiles.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}

export function trackRecentFile(fileId: string, name: string, originApp: AppId): void {
	const item: RecentFileActivity = {
		fileId,
		name,
		originApp,
		lastOpenedAt: Date.now()
	};
	recentFiles.update((list) => {
		const filtered = list.filter((entry) => entry.fileId !== fileId);
		return [item, ...filtered].slice(0, 30);
	});
}
