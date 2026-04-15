<svelte:options runes={false} />

<script lang="ts">
	import type { AppId } from '$lib/system/types';
	import {
		Activity,
		AppWindow,
		CirclePlay,
		FileText,
		FolderOpen,
		Globe,
		Settings,
		Terminal
	} from 'lucide-svelte';

	export let appId: AppId | undefined;
	export let size = 18;
	export let className = '';
</script>

{#if appId === 'explorer'}
	<FolderOpen size={size} class={className} />
{:else if appId === 'settings'}
	<Settings size={size} class={className} />
{:else if appId === 'notepad'}
	<FileText size={size} class={className} />
{:else if appId === 'terminal'}
	<Terminal size={size} class={className} />
{:else if appId === 'browser'}
	<Globe size={size} class={className} />
{:else if appId === 'media'}
	<CirclePlay size={size} class={className} />
{:else if appId === 'monitor'}
	<Activity size={size} class={className} />
{:else}
	<AppWindow size={size} class={className} />
{/if}
