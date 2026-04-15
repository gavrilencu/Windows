<svelte:options runes={false} />

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { MoonStar, Power, RotateCcw } from 'lucide-svelte';
	import { APP_LIST } from '$lib/apps/registry';
	import AppIcon from '$lib/components/common/AppIcon.svelte';
	import { restartSystem, session, shutdownSystem, sleepSystem } from '$lib/stores/session';
	import { buildAppPayloadForNode, getAssociatedAppForFile } from '$lib/system/fileAssociations';
	import { recentFiles, trackRecentFile } from '$lib/stores/activity';
	import { appLaunchCounts, launchApp, pinnedApps, startMenuOpen } from '$lib/stores/windows';
	import { getNodeById } from '$lib/system/vfs';
	import { vfsNodes } from '$lib/stores/vfs';
	import { searchAppsAndFiles } from '$lib/system/search';

	let query = '';
	let showAllApps = false;
	let powerMenuOpen = false;
	$: results = query ? searchAppsAndFiles(query, APP_LIST, $vfsNodes) : [];
	$: allApps = [...APP_LIST].sort((a, b) => a.name.localeCompare(b.name));
	$: pinnedList = $pinnedApps
		.map((id) => APP_LIST.find((app) => app.id === id))
		.filter((app): app is (typeof APP_LIST)[number] => Boolean(app));
	$: mostUsedApps = [...APP_LIST].sort((a, b) => ($appLaunchCounts[b.id] ?? 0) - ($appLaunchCounts[a.id] ?? 0)).slice(0, 5);
	$: recentFilesList = [...$recentFiles].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 6);

	const runApp = (appId: Parameters<typeof launchApp>[0]) => {
		launchApp(appId);
		query = '';
		powerMenuOpen = false;
	};

	const runRecommended = (kind: 'file' | 'settings' | 'notepad') => {
		if (kind === 'settings') runApp('settings');
		else if (kind === 'notepad') runApp('notepad');
		else runApp('explorer');
	};

	const openFileFromSearch = async (nodeId: string | undefined, label: string) => {
		if (!nodeId) return;
		const node = await getNodeById(nodeId);
		if (!node || node.type !== 'file') return;
		const app = getAssociatedAppForFile(node);
		trackRecentFile(nodeId, label, app);
		launchApp(app, buildAppPayloadForNode(node));
	};

	const openRecentFile = async (nodeId: string) => {
		const node = await getNodeById(nodeId);
		if (!node || node.type !== 'file') return;
		const app = getAssociatedAppForFile(node);
		trackRecentFile(node.id, node.name, app);
		launchApp(app, buildAppPayloadForNode(node));
	};

	const applyPowerAction = (action: 'sleep' | 'restart' | 'shutdown') => {
		startMenuOpen.set(false);
		powerMenuOpen = false;
		if (action === 'sleep') sleepSystem();
		else if (action === 'restart') restartSystem();
		else shutdownSystem();
	};
</script>

{#if $startMenuOpen}
	<div
		class="start-menu-panel glass absolute bottom-[66px] left-1/2 z-40 max-h-[70vh] w-[min(640px,94vw)] -translate-x-1/2 overflow-auto rounded-[20px] p-4"
		transition:fly={{ y: 16, duration: 180, opacity: 0.18 }}
	>
		<input
			class="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
			bind:value={query}
			placeholder="Search apps, settings and files"
		/>
		{#if !query}
			<div class="mb-2 mt-4 text-xs text-[var(--muted)]">Pinned</div>
			<div class="grid grid-cols-4 gap-2">
				{#each pinnedList as app}
					<button
						class="grid justify-items-center gap-1.5 rounded-xl bg-white/10 p-2 text-[var(--text)] hover:bg-white/20"
						on:click={() => runApp(app.id)}
					>
						<div class="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-blue-300/40">
							<AppIcon appId={app.id} size={17} />
						</div>
						<span class="text-[11px]">{app.name}</span>
						<small class="text-[10px] text-[var(--muted)]">Launched {$appLaunchCounts[app.id] ?? 0}x</small>
					</button>
				{/each}
			</div>
			<div class="mb-2 mt-4 text-xs text-[var(--muted)]">Recommended</div>
			<div class="grid gap-1.5 text-sm text-[var(--muted)]">
				<button class="rounded-lg bg-white/10 p-2 text-left hover:bg-white/20" on:click={() => runRecommended('file')}>Welcome.txt</button>
				<button class="rounded-lg bg-white/10 p-2 text-left hover:bg-white/20" on:click={() => runRecommended('settings')}>Settings</button>
				<button class="rounded-lg bg-white/10 p-2 text-left hover:bg-white/20" on:click={() => runRecommended('notepad')}>Notepad draft</button>
			</div>
			<div class="mb-2 mt-4 text-xs text-[var(--muted)]">Most used</div>
			<div class="grid gap-1">
				{#each mostUsedApps as app}
					<button
						class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-white/10 px-2 py-2 text-left hover:bg-white/20"
						on:click={() => runApp(app.id)}
					>
						<div class="grid h-7 w-7 place-items-center rounded-md bg-white/15">
							<AppIcon appId={app.id} size={14} />
						</div>
						<div class="text-sm text-[var(--text)]">{app.name}</div>
						<div class="rounded-md bg-black/20 px-2 py-1 text-[10px] text-[var(--muted)]">{$appLaunchCounts[app.id] ?? 0}x</div>
					</button>
				{/each}
			</div>
			<div class="mb-2 mt-4 text-xs text-[var(--muted)]">Recent files</div>
			{#if !recentFilesList.length}
				<div class="rounded-lg bg-white/5 p-2 text-xs text-[var(--muted)]">No recent files yet.</div>
			{:else}
				<div class="grid gap-1">
					{#each recentFilesList as item}
						<button
							class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-white/10 px-2 py-2 text-left hover:bg-white/20"
							on:click={() => openRecentFile(item.fileId)}
						>
							<div>
								<div class="text-sm text-[var(--text)]">{item.name}</div>
								<div class="text-[10px] text-[var(--muted)]">{new Date(item.lastOpenedAt).toLocaleString()}</div>
							</div>
							<div class="text-[10px] text-[var(--muted)]">{item.originApp}</div>
						</button>
					{/each}
				</div>
			{/if}
			<div class="mb-2 mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
				<span>All apps</span>
				<button class="rounded-md bg-white/10 px-2 py-1 hover:bg-white/20" on:click={() => (showAllApps = !showAllApps)}>
					{showAllApps ? 'Hide' : 'Show'}
				</button>
			</div>
			{#if showAllApps}
				<div class="grid gap-1">
					{#each allApps as app}
						<button
							class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-white/10 px-2 py-2 text-left hover:bg-white/20"
							on:click={() => runApp(app.id)}
						>
							<div class="grid h-7 w-7 place-items-center rounded-md bg-white/15">
								<AppIcon appId={app.id} size={14} />
							</div>
							<div>
								<div class="text-sm text-[var(--text)]">{app.name}</div>
								<div class="text-[10px] text-[var(--muted)]">{app.description}</div>
							</div>
							<div class="rounded-md bg-black/20 px-2 py-1 text-[10px] text-[var(--muted)]">{$appLaunchCounts[app.id] ?? 0}x</div>
						</button>
					{/each}
				</div>
			{/if}
			<div class="mt-4 flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-2">
				<div class="min-w-0">
					<div class="truncate text-sm font-medium text-[var(--text)]">{$session.username || 'User'}</div>
					<div class="text-[10px] text-[var(--muted)]">Local account</div>
				</div>
				<div class="relative">
					<button
						class="rounded-lg bg-white/10 p-2 text-[var(--text)] hover:bg-white/20"
						title="Power"
						on:click={() => (powerMenuOpen = !powerMenuOpen)}
					>
						<Power size={16} />
					</button>
					{#if powerMenuOpen}
						<div class="absolute bottom-11 right-0 z-20 grid min-w-[170px] gap-1 rounded-xl border border-white/20 bg-[rgba(17,22,34,0.94)] p-2 shadow-2xl backdrop-blur-xl">
							<button class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/15" on:click={() => applyPowerAction('sleep')}>
								<MoonStar size={14} />
								<span>Sleep</span>
							</button>
							<button class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/15" on:click={() => applyPowerAction('restart')}>
								<RotateCcw size={14} />
								<span>Restart</span>
							</button>
							<button class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-red-500/25" on:click={() => applyPowerAction('shutdown')}>
								<Power size={14} />
								<span>Shut down</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="mt-2">
				{#if !results.length}
					<div class="rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">No results</div>
				{:else}
					{#each results as result}
						<button
							class="mt-1.5 grid w-full rounded-lg bg-white/10 p-2.5 text-left text-[var(--text)] hover:bg-white/20"
							on:click={() =>
								result.appId
									? runApp(result.appId as Parameters<typeof launchApp>[0])
									: result.type === 'file'
										? openFileFromSearch(result.nodeId, result.label)
										: runApp('explorer')}
						>
							<strong>{result.label}</strong>
							<small>{result.subtitle}</small>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
{/if}
