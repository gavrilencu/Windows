import { get, writable } from 'svelte/store';
import type { DesktopIcon } from '$lib/system/types';
import { DESKTOP_FOLDER_ID } from '$lib/system/constants';
import { withDB } from '$lib/system/db';
import { listChildren } from '$lib/system/vfs';

export const desktopIcons = writable<DesktopIcon[]>([]);
export const desktopSelection = writable<string[]>([]);

export async function loadDesktopIcons(): Promise<void> {
	const icons = await withDB((db) => db.getAll('icons'));
	desktopIcons.set(icons.sort((a, b) => a.y - b.y || a.x - b.x));
	await syncDesktopShortcutsFromVfs();
}

export async function persistIcon(icon: DesktopIcon): Promise<void> {
	await withDB((db) => db.put('icons', icon, icon.id));
}

export async function moveIcon(id: string, x: number, y: number): Promise<void> {
	let changed: DesktopIcon | undefined;
	desktopIcons.update((list) =>
		list.map((icon) => {
			if (icon.id !== id) return icon;
			changed = { ...icon, x, y };
			return changed;
		})
	);
	if (changed) {
		await persistIcon(changed);
	}
}

export function selectIcon(id: string, additive = false): void {
	if (!additive) {
		desktopSelection.set([id]);
		return;
	}
	const set = new Set(get(desktopSelection));
	if (set.has(id)) set.delete(id);
	else set.add(id);
	desktopSelection.set([...set]);
}

export function clearSelection(): void {
	desktopSelection.set([]);
}

export async function syncDesktopShortcutsFromVfs(): Promise<void> {
	const nodes = await listChildren(DESKTOP_FOLDER_ID);
	const shortcuts = nodes.map((node, index) => ({
		id: `shortcut-${node.id}`,
		title: node.name,
		fileId: node.id,
		x: 120 + (index % 2) * 96,
		y: 28 + Math.floor(index / 2) * 98
	}));

	const existingIcons = await withDB((db) => db.getAll('icons'));
	const existingById = new Map(existingIcons.map((icon) => [icon.id, icon]));
	const fileShortcutIds = new Set(shortcuts.map((shortcut) => shortcut.id));
	const staleShortcuts = existingIcons.filter((icon) => icon.id.startsWith('shortcut-') && !fileShortcutIds.has(icon.id));

	for (const stale of staleShortcuts) {
		await withDB((db) => db.delete('icons', stale.id));
	}

	for (const shortcut of shortcuts) {
		const previous = existingById.get(shortcut.id);
		const icon: DesktopIcon = previous
			? { ...previous, title: shortcut.title, fileId: shortcut.fileId }
			: shortcut;
		await withDB((db) => db.put('icons', icon, icon.id));
	}

	const finalIcons = await withDB((db) => db.getAll('icons'));
	desktopIcons.set(finalIcons.sort((a, b) => a.y - b.y || a.x - b.x));
}
