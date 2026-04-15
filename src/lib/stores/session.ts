import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { SessionState, SystemPhase, ThemeMode } from '$lib/system/types';
import { withDB } from '$lib/system/db';
import { sha256, verifyHash } from '$lib/system/security';

export const systemPhase = writable<SystemPhase>('boot');
export const session = writable<SessionState>({ isAuthenticated: false, username: 'Guest' });
export const theme = writable<ThemeMode>('dark');
export const wallpaper = writable('');
export const lockscreenWallpaper = writable('');
export const accentColor = writable('#5b9cff');

export async function loadSessionState(): Promise<void> {
	if (!browser) return;
	const [pref, credentials] = await Promise.all([
		withDB((db) => db.get('preferences', 'main')),
		withDB((db) => db.getAll('credentials'))
	]);

	if (pref) {
		theme.set(pref.theme);
		wallpaper.set(pref.wallpaper);
		lockscreenWallpaper.set(pref.lockscreenWallpaper);
		accentColor.set(pref.accentColor);
	}

	if (!credentials.length) {
		await registerDefaultUser();
	}
}

export async function registerDefaultUser(): Promise<void> {
	const pinHash = await sha256('1234');
	await withDB((db) =>
		db.put(
			'credentials',
			{
				id: 'default',
				username: 'User',
				pinHash,
				createdAt: Date.now()
			},
			'default'
		)
	);
}

export async function unlockWithCredential(value: string): Promise<boolean> {
	const cred = await withDB((db) => db.get('credentials', 'default'));
	if (!cred) return false;
	const ok = (await verifyHash(value, cred.pinHash)) || (cred.passwordHash ? await verifyHash(value, cred.passwordHash) : false);
	if (ok) {
		session.set({ isAuthenticated: true, username: cred.username });
		systemPhase.set('desktop');
	}
	return ok;
}

export async function updatePreferences(partial: {
	theme?: ThemeMode;
	wallpaper?: string;
	lockscreenWallpaper?: string;
	accentColor?: string;
}): Promise<void> {
	const current = await withDB((db) => db.get('preferences', 'main'));
	if (!current) return;
	const next = { ...current, ...partial };
	await withDB((db) => db.put('preferences', next, 'main'));
	if (partial.theme) theme.set(partial.theme);
	if (partial.wallpaper) wallpaper.set(partial.wallpaper);
	if (partial.lockscreenWallpaper) lockscreenWallpaper.set(partial.lockscreenWallpaper);
	if (partial.accentColor) accentColor.set(partial.accentColor);
}

export async function updatePin(oldSecret: string, newPin: string): Promise<boolean> {
	const cred = await withDB((db) => db.get('credentials', 'default'));
	if (!cred) return false;
	const oldOk =
		(await verifyHash(oldSecret, cred.pinHash)) ||
		(cred.passwordHash ? await verifyHash(oldSecret, cred.passwordHash) : false);
	if (!oldOk) return false;
	cred.pinHash = await sha256(newPin);
	await withDB((db) => db.put('credentials', cred, cred.id));
	return true;
}
