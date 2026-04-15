<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { withDB } from '$lib/system/db';
	import { getNodeById, writeFile } from '$lib/system/vfs';
	import { trackRecentFile } from '$lib/stores/activity';

	export let payload: Record<string, unknown> = {};

	let content = '';
	let lastSaved = 0;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let editingFileId = '';
	let fileName = 'New note';

	const save = async () => {
		if (editingFileId) {
			await writeFile(editingFileId, content);
			trackRecentFile(editingFileId, fileName, 'notepad');
		} else {
			await withDB((db) => db.put('notes', { id: 'notepad-main', content, updatedAt: Date.now() }, 'notepad-main'));
		}
		lastSaved = Date.now();
	};

	const scheduleSave = () => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			void save();
		}, 350);
	};

	onMount(async () => {
		const fileId = payload.fileId;
		if (typeof fileId === 'string') {
			const node = await getNodeById(fileId);
			if (node?.type === 'file') {
				editingFileId = node.id;
				fileName = node.name;
				content = node.content;
				lastSaved = node.updatedAt;
				trackRecentFile(node.id, node.name, 'notepad');
				return;
			}
		}
		const note = await withDB((db) => db.get('notes', 'notepad-main'));
		content = note?.content ?? '';
		lastSaved = note?.updatedAt ?? Date.now();
	});
</script>

<div class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)]">
	<div class="border-b border-white/10 px-3 py-2 text-xs text-[var(--muted)]">
		{editingFileId ? `Editing: ${fileName}` : 'Autosave enabled'} | Last save: {new Date(lastSaved).toLocaleTimeString()}
	</div>
	<textarea
		class="h-full w-full resize-none border-0 bg-transparent p-4 text-[var(--text)] outline-none"
		bind:value={content}
		on:input={scheduleSave}
		placeholder="Type your notes..."
	></textarea>
</div>
