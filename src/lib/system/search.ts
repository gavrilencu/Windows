import type { AppDefinition, VirtualNode } from '$lib/system/types';

export interface SearchResult {
	id: string;
	label: string;
	subtitle: string;
	type: 'app' | 'file' | 'folder';
	appId?: string;
	nodeId?: string;
}

export function searchAppsAndFiles(
	query: string,
	apps: AppDefinition[],
	nodes: VirtualNode[]
): SearchResult[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];

	const appResults: SearchResult[] = apps
		.filter((app) => app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q))
		.map((app) => ({
			id: `app-${app.id}`,
			label: app.name,
			subtitle: app.description,
			type: 'app',
			appId: app.id
		}));

	const fileResults: SearchResult[] = nodes
		.filter((node) => node.name.toLowerCase().includes(q))
		.slice(0, 20)
		.map((node) => ({
			id: `node-${node.id}`,
			label: node.name,
			subtitle: node.type === 'folder' ? 'Folder' : `${node.size} bytes`,
			type: node.type,
			nodeId: node.id
		}));

	return [...appResults, ...fileResults].slice(0, 30);
}
