<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createFile,
		createFolder,
		deleteNode,
		emptyRecycleBin,
		listChildren,
		renameNode,
		restoreNodeFromRecycle
	} from '$lib/system/vfs';
	import { RECYCLE_FOLDER_ID } from '$lib/system/constants';
	import { buildAppPayloadForNode, getAssociatedAppForFile } from '$lib/system/fileAssociations';
	import type { VirtualNode } from '$lib/system/types';
	import { trackRecentFile } from '$lib/stores/activity';
	import { pushNotification } from '$lib/stores/notifications';
	import { syncDesktopShortcutsFromVfs } from '$lib/stores/desktop';
	import { refreshVfsNodes } from '$lib/stores/vfs';
	import { launchApp } from '$lib/stores/windows';

	export let payload: Record<string, unknown> = {};

	const quickLocations = [
		{ id: 'desktop', label: 'Desktop' },
		{ id: 'documents', label: 'Documents' },
		{ id: 'media', label: 'Media' },
		{ id: RECYCLE_FOLDER_ID, label: 'Recycle Bin' },
		{ id: 'root', label: 'This PC' }
	];

	let currentFolder = (payload.nodeId as string) || 'desktop';
	let nodes: VirtualNode[] = [];
	let renamingId = '';
	let renameValue = '';

	const load = async () => {
		nodes = await listChildren(currentFolder);
		await refreshVfsNodes();
	};

	onMount(() => {
		void load();
	});

	const openNode = async (node: VirtualNode) => {
		if (node.type === 'folder') {
			currentFolder = node.id;
			await load();
			return;
		}
		if (currentFolder === RECYCLE_FOLDER_ID) {
			await pushNotification({
				title: 'Recycle Bin',
				message: 'Restore the file before opening it.',
				type: 'warning'
			});
			return;
		}
		const app = getAssociatedAppForFile(node);
		trackRecentFile(node.id, node.name, app);
		launchApp(app, buildAppPayloadForNode(node));
	};

	const addFolder = async () => {
		await createFolder(currentFolder, `Folder ${Math.floor(Math.random() * 99)}`);
		await load();
	};

	const addFile = async () => {
		await createFile(currentFolder, `File ${Math.floor(Math.random() * 99)}.txt`, '');
		await load();
	};

	const startRename = (node: VirtualNode) => {
		renamingId = node.id;
		renameValue = node.name;
	};

	const applyRename = async () => {
		if (!renameValue.trim() || !renamingId) return;
		await renameNode(renamingId, renameValue.trim());
		renamingId = '';
		await load();
	};

	const removeNode = async (id: string) => {
		await deleteNode(id);
		await load();
		await syncDesktopShortcutsFromVfs();
	};

	const restoreNode = async (id: string) => {
		await restoreNodeFromRecycle(id);
		await load();
		await syncDesktopShortcutsFromVfs();
	};

	const clearRecycleBin = async () => {
		await emptyRecycleBin();
		await load();
		await syncDesktopShortcutsFromVfs();
	};
</script>

<div class="h-full w-full grid-cols-[200px_minmax(0,1fr)] md:grid">
	<aside class="grid content-start gap-1 border-r border-white/10 p-2">
		{#each quickLocations as loc}
			<button
				class={`rounded-lg px-2 py-1.5 text-left ${currentFolder === loc.id ? 'bg-white/20' : 'hover:bg-white/15'}`}
				on:click={() => ((currentFolder = loc.id), load())}
			>
				{loc.label}
			</button>
		{/each}
	</aside>
	<section>
		<div class="flex items-center gap-2 border-b border-white/10 px-3 py-2">
			{#if currentFolder !== RECYCLE_FOLDER_ID}
				<button class="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25" on:click={addFolder}>New Folder</button>
				<button class="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25" on:click={addFile}>New File</button>
			{:else}
				<button class="rounded-lg bg-red-500/30 px-2 py-1 text-sm hover:bg-red-500/50" on:click={clearRecycleBin}>Empty Recycle Bin</button>
			{/if}
			<div class="ml-auto text-xs text-[var(--muted)]">{currentFolder}</div>
		</div>
		<div class="grid gap-1 p-2.5">
			{#each nodes as node}
				<div
					class="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10"
					role="button"
					tabindex="0"
					on:dblclick={() => openNode(node)}
					on:keydown={(e) => e.key === 'Enter' && openNode(node)}
				>
					<div class="flex items-center gap-2">
						<span>{node.type === 'folder' ? '📁' : '📄'}</span>
						{#if renamingId === node.id}
							<input
								class="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm"
								bind:value={renameValue}
								on:keydown={(e) => e.key === 'Enter' && applyRename()}
							/>
						{:else}
							<span>{node.name}</span>
						{/if}
					</div>
					<div class="flex gap-1">
						{#if currentFolder !== RECYCLE_FOLDER_ID}
							<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => startRename(node)}>Rename</button>
							<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => removeNode(node.id)}>Delete</button>
						{:else}
							<button class="rounded-md bg-emerald-500/25 px-2 py-1 text-xs hover:bg-emerald-500/40" on:click={() => restoreNode(node.id)}>Restore</button>
							<button class="rounded-md bg-red-500/35 px-2 py-1 text-xs hover:bg-red-500/55" on:click={() => removeNode(node.id)}>Delete forever</button>
						{/if}
					</div>
				</div>
			{/each}
			{#if !nodes.length}
				<div class="rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">This folder is empty</div>
			{/if}
		</div>
	</section>
</div>
