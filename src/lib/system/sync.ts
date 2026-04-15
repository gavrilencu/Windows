import { browser } from '$app/environment';
import { withDB } from '$lib/system/db';
import type { SyncBundle } from '$lib/system/types';
import { loadDesktopIcons } from '$lib/stores/desktop';
import { loadNotifications } from '$lib/stores/notifications';
import { loadSessionState } from '$lib/stores/session';
import { refreshVfsNodes } from '$lib/stores/vfs';

export interface SyncStatus {
	ok: boolean;
	hasSnapshot: boolean;
	lastSyncedAt: number | null;
	snapshotCount: number;
}

export async function exportLocalState(): Promise<SyncBundle> {
	return withDB(async (db) => ({
		preferences: (await db.get('preferences', 'main')) ?? null,
		credentials: await db.getAll('credentials'),
		icons: await db.getAll('icons'),
		vfs: await db.getAll('vfs'),
		notes: await db.getAll('notes'),
		notifications: await db.getAll('notifications')
	}));
}

export async function importLocalState(bundle: SyncBundle): Promise<void> {
	await withDB(async (db) => {
		await db.clear('preferences');
		await db.clear('credentials');
		await db.clear('icons');
		await db.clear('vfs');
		await db.clear('notes');
		await db.clear('notifications');

		if (bundle.preferences) await db.put('preferences', bundle.preferences, 'main');
		for (const cred of bundle.credentials) await db.put('credentials', cred, cred.id);
		for (const icon of bundle.icons) await db.put('icons', icon, icon.id);
		for (const node of bundle.vfs) await db.put('vfs', node, node.id);
		for (const note of bundle.notes) await db.put('notes', note, note.id);
		for (const notification of bundle.notifications) {
			await db.put('notifications', notification, notification.id);
		}
	});

	await Promise.all([loadSessionState(), loadDesktopIcons(), refreshVfsNodes(), loadNotifications()]);
}

export async function pushLocalStateToSQLite(): Promise<void> {
	const payload = await exportLocalState();
	const response = await fetch('/api/sync/push', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!response.ok) {
		throw new Error(`SQLite push failed: ${response.status}`);
	}
}

export async function pullStateFromSQLite(): Promise<boolean> {
	const response = await fetch('/api/sync/pull');
	if (!response.ok) throw new Error(`SQLite pull failed: ${response.status}`);
	const data = (await response.json()) as { ok: boolean; hasSnapshot: boolean; payload?: SyncBundle };
	if (!data.hasSnapshot || !data.payload) return false;
	await importLocalState(data.payload);
	return true;
}

export async function getSQLiteSyncStatus(): Promise<SyncStatus | null> {
	if (!browser) return null;
	const response = await fetch('/api/sync/status');
	if (!response.ok) throw new Error(`SQLite status failed: ${response.status}`);
	return (await response.json()) as SyncStatus;
}
