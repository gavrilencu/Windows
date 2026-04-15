import type { AppId, VirtualFile, VirtualNode } from '$lib/system/types';

export function getAssociatedAppForFile(file: VirtualFile): AppId {
	const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
	const textExtensions = new Set(['txt', 'md', 'log', 'json', 'csv', 'xml', 'ini', 'yaml', 'yml']);
	const browserExtensions = new Set(['url', 'html', 'htm']);
	const mediaExtensions = new Set(['mp3', 'wav', 'ogg', 'flac', 'mp4', 'webm', 'mov', 'mkv']);

	if (browserExtensions.has(extension)) return 'browser';
	if (mediaExtensions.has(extension)) return 'media';
	if (textExtensions.has(extension)) return 'notepad';
	if (file.mimeType.startsWith('audio/') || file.mimeType.startsWith('video/')) return 'media';
	return 'notepad';
}

export function buildAppPayloadForNode(node: VirtualNode): Record<string, unknown> {
	if (node.type === 'folder') {
		return { nodeId: node.id };
	}

	const appId = getAssociatedAppForFile(node);
	if (appId === 'browser') {
		const normalized =
			typeof node.content === 'string' && /^https?:\/\//i.test(node.content.trim())
				? node.content.trim()
				: undefined;
		return { fileId: node.id, url: normalized };
	}

	return { fileId: node.id };
}
