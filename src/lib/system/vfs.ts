import { withDB } from '$lib/system/db';
import { DESKTOP_FOLDER_ID, RECYCLE_FOLDER_ID, ROOT_FOLDER_ID } from '$lib/system/constants';
import type { VirtualFile, VirtualNode } from '$lib/system/types';

export async function listChildren(parentId: string | null): Promise<VirtualNode[]> {
	return withDB(async (db) => {
		const nodes = (await db.getAll('vfs')).filter((node) => node.parentId === parentId);
		return nodes.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	});
}

export async function listAllNodes(): Promise<VirtualNode[]> {
	return withDB(async (db) => db.getAll('vfs'));
}

export async function getNodeById(id: string): Promise<VirtualNode | undefined> {
	return withDB(async (db) => db.get('vfs', id));
}

export async function createFolder(parentId: string | null, name: string): Promise<void> {
	const node = {
		id: `folder-${crypto.randomUUID()}`,
		type: 'folder' as const,
		name,
		parentId,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
	await withDB(async (db) => db.put('vfs', node, node.id));
}

export async function createFile(parentId: string | null, name: string, content = ''): Promise<void> {
	const node: VirtualFile = {
		id: `file-${crypto.randomUUID()}`,
		type: 'file',
		name,
		parentId,
		content,
		mimeType: 'text/plain',
		size: content.length,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
	await withDB(async (db) => db.put('vfs', node, node.id));
}

export async function renameNode(id: string, name: string): Promise<void> {
	await withDB(async (db) => {
		const node = await db.get('vfs', id);
		if (!node) return;
		node.name = name;
		node.updatedAt = Date.now();
		await db.put('vfs', node, node.id);
	});
}

export async function deleteNode(id: string): Promise<void> {
	await withDB(async (db) => {
		const markRecursive = async (nodeId: string, deletedAt: number): Promise<void> => {
			const node = await db.get('vfs', nodeId);
			if (!node) return;

			if (node.type === 'folder') {
				const children = (await db.getAll('vfs')).filter((item) => item.parentId === nodeId);
				for (const child of children) {
					await markRecursive(child.id, deletedAt);
				}
			}
			node.deletedAt = deletedAt;
			node.updatedAt = deletedAt;
			await db.put('vfs', node, node.id);
		};

		const node = await db.get('vfs', id);
		if (!node) return;
		if (node.id === ROOT_FOLDER_ID || node.id === RECYCLE_FOLDER_ID) return;

		// If item is already in recycle bin, permanently delete it.
		if (node.parentId === RECYCLE_FOLDER_ID) {
			const removeRecursive = async (nodeId: string): Promise<void> => {
				const current = await db.get('vfs', nodeId);
				if (!current) return;
				if (current.type === 'folder') {
					const children = (await db.getAll('vfs')).filter((item) => item.parentId === nodeId);
					for (const child of children) {
						await removeRecursive(child.id);
					}
				}
				await db.delete('vfs', nodeId);
			};
			await removeRecursive(id);
			return;
		}

		node.originalParentId = node.parentId ?? DESKTOP_FOLDER_ID;
		node.parentId = RECYCLE_FOLDER_ID;
		node.deletedAt = Date.now();
		node.updatedAt = Date.now();
		await db.put('vfs', node, node.id);
		await markRecursive(node.id, node.deletedAt);
	});
}

export async function writeFile(id: string, content: string): Promise<void> {
	await withDB(async (db) => {
		const node = await db.get('vfs', id);
		if (!node || node.type !== 'file') return;
		node.content = content;
		node.size = content.length;
		node.updatedAt = Date.now();
		await db.put('vfs', node, node.id);
	});
}

export async function restoreNodeFromRecycle(id: string): Promise<void> {
	await withDB(async (db) => {
		const node = await db.get('vfs', id);
		if (!node || node.parentId !== RECYCLE_FOLDER_ID) return;
		const parentId = node.originalParentId ?? DESKTOP_FOLDER_ID;

		const restoreRecursive = async (nodeId: string): Promise<void> => {
			const current = await db.get('vfs', nodeId);
			if (!current) return;
			current.deletedAt = null;
			current.updatedAt = Date.now();
			await db.put('vfs', current, current.id);
			if (current.type === 'folder') {
				const children = (await db.getAll('vfs')).filter((item) => item.parentId === nodeId);
				for (const child of children) {
					await restoreRecursive(child.id);
				}
			}
		};

		node.parentId = parentId;
		node.deletedAt = null;
		node.updatedAt = Date.now();
		await db.put('vfs', node, node.id);
		await restoreRecursive(node.id);
	});
}

export async function emptyRecycleBin(): Promise<void> {
	const items = await listChildren(RECYCLE_FOLDER_ID);
	for (const item of items) {
		await deleteNode(item.id);
	}
}
