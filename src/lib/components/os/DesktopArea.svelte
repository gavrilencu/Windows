<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import AppIcon from '$lib/components/common/AppIcon.svelte';
	import { FileText, Folder, Recycle } from 'lucide-svelte';
	import {
		clearSelection,
		desktopIcons,
		desktopSelection,
		loadDesktopIcons,
		moveIcon,
		selectIcon,
		syncDesktopShortcutsFromVfs
	} from '$lib/stores/desktop';
	import { pushNotification } from '$lib/stores/notifications';
	import { launchApp } from '$lib/stores/windows';
	import { buildAppPayloadForNode, getAssociatedAppForFile } from '$lib/system/fileAssociations';
	import { createFile, createFolder, deleteNode, getNodeById, renameNode } from '$lib/system/vfs';
	import { refreshVfsNodes } from '$lib/stores/vfs';

	interface MenuState {
		open: boolean;
		x: number;
		y: number;
	}

	let contextMenu: MenuState = { open: false, x: 0, y: 0 };
	let dragTarget = '';
	let dragOffset = { x: 0, y: 0 };

	onMount(() => {
		void loadDesktopIcons();
	});

	const openDesktopMenu = (e: MouseEvent) => {
		e.preventDefault();
		clearSelection();
		contextMenu = { open: true, x: e.clientX, y: e.clientY };
	};

	const launchFromIcon = async (iconId: string) => {
		const icon = $desktopIcons.find((i) => i.id === iconId);
		if (icon?.appId) launchApp(icon.appId);
		if (icon?.fileId) {
			const node = await getNodeById(icon.fileId);
			if (!node) return;
			if (node.type === 'folder') {
				launchApp('explorer', { nodeId: node.id });
				return;
			}
			launchApp(getAssociatedAppForFile(node), buildAppPayloadForNode(node));
		}
	};

	const startDrag = (e: PointerEvent, id: string) => {
		const icon = $desktopIcons.find((i) => i.id === id);
		if (!icon) return;
		dragTarget = id;
		dragOffset = { x: e.clientX - icon.x, y: e.clientY - icon.y };
	};

	const onMove = async (e: PointerEvent) => {
		if (!dragTarget) return;
		await moveIcon(dragTarget, Math.max(12, e.clientX - dragOffset.x), Math.max(12, e.clientY - dragOffset.y));
	};

	const stopDrag = () => (dragTarget = '');

	const createNewFolder = async () => {
		await createFolder('desktop', `New folder ${Math.floor(Math.random() * 99)}`);
		await refreshVfsNodes();
		await syncDesktopShortcutsFromVfs();
		contextMenu.open = false;
	};

	const createTextFile = async () => {
		await createFile('desktop', `New file ${Math.floor(Math.random() * 99)}.txt`, '');
		await refreshVfsNodes();
		await syncDesktopShortcutsFromVfs();
		contextMenu.open = false;
	};

	const handleDesktopKey = async (e: KeyboardEvent) => {
		const selectedIconId = $desktopSelection[0];
		if (!selectedIconId) return;
		const selected = $desktopIcons.find((icon) => icon.id === selectedIconId);
		if (!selected?.fileId) return;

		if (e.key === 'Enter') {
			await launchFromIcon(selected.id);
			return;
		}

		if (e.key === 'Delete') {
			await deleteNode(selected.fileId);
			await refreshVfsNodes();
			await syncDesktopShortcutsFromVfs();
			await pushNotification({ title: 'Recycle Bin', message: 'Item moved to Recycle Bin.', type: 'info' });
			return;
		}

		if (e.key === 'F2') {
			const target = await getNodeById(selected.fileId);
			if (!target) return;
			const nameWithoutExt = target.name.replace(/\.[^/.]+$/, '');
			const nextName = window.prompt('Rename item', nameWithoutExt);
			if (!nextName?.trim()) return;
			const extension = target.type === 'file' ? target.name.match(/(\.[^.]*)$/)?.[1] ?? '' : '';
			const finalName = target.type === 'file' ? `${nextName.trim()}${extension}` : nextName.trim();
			await renameNode(selected.fileId, finalName);
			await refreshVfsNodes();
			await syncDesktopShortcutsFromVfs();
		}
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="absolute inset-x-0 bottom-[58px] top-0"
	role="application"
	tabindex="-1"
	on:click={() => {
		clearSelection();
		contextMenu.open = false;
	}}
	on:contextmenu={openDesktopMenu}
	on:pointermove={onMove}
	on:pointerup={stopDrag}
	on:keydown={handleDesktopKey}
>
	{#each $desktopIcons as icon}
		<button
			class={`absolute grid w-[84px] justify-items-center rounded-lg p-1 text-[11px] text-white transition ${
				$desktopSelection.includes(icon.id) ? 'bg-blue-300/35' : 'hover:bg-white/10'
			}`}
			style={`left:${icon.x}px;top:${icon.y}px`}
			on:click|stopPropagation={(e) => selectIcon(icon.id, e.ctrlKey || e.metaKey)}
			on:dblclick|stopPropagation={() => launchFromIcon(icon.id)}
			on:pointerdown|stopPropagation={(e) => startDrag(e, icon.id)}
		>
			<div class="mb-1.5 grid h-12 w-12 place-items-center rounded-[14px] border border-white/20 bg-slate-950/55 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
				{#if icon.appId}
					<AppIcon appId={icon.appId} size={20} />
				{:else if icon.fileId === 'recycle'}
					<Recycle size={19} />
				{:else if icon.fileId?.startsWith('folder-')}
					<Folder size={19} />
				{:else}
					<FileText size={19} />
				{/if}
			</div>
			<span class="line-clamp-2 text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">{icon.title}</span>
		</button>
	{/each}

	{#if contextMenu.open}
		<div
			class="glass absolute grid min-w-[190px] gap-1 rounded-xl p-2"
			style={`left:${contextMenu.x}px;top:${contextMenu.y}px`}
			role="menu"
			tabindex="0"
			on:click|stopPropagation
			on:keydown={() => {}}
		>
			<button class="rounded-lg px-3 py-1.5 text-left text-[var(--text)] hover:bg-blue-200/30" on:click={createNewFolder}>
				New folder
			</button>
			<button class="rounded-lg px-3 py-1.5 text-left text-[var(--text)] hover:bg-blue-200/30" on:click={createTextFile}>
				New text file
			</button>
			<button class="rounded-lg px-3 py-1.5 text-left text-[var(--text)] hover:bg-blue-200/30" on:click={() => launchApp('settings')}>
				Personalize
			</button>
		</div>
	{/if}
</div>
