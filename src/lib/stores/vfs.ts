import { writable } from 'svelte/store';
import type { VirtualNode } from '$lib/system/types';
import { syncDesktopShortcutsFromVfs } from '$lib/stores/desktop';
import { listAllNodes } from '$lib/system/vfs';

export const vfsNodes = writable<VirtualNode[]>([]);

export async function refreshVfsNodes(): Promise<void> {
	const nodes = await listAllNodes();
	vfsNodes.set(nodes);
	await syncDesktopShortcutsFromVfs();
}
