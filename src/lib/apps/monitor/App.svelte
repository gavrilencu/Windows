<svelte:options runes={false} />

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import AppIcon from '$lib/components/common/AppIcon.svelte';
	import { APPS_REGISTRY } from '$lib/apps/registry';
	import { closeAppGroup, closeWindow, focusWindow, minimizeWindow, windows } from '$lib/stores/windows';
	import type { AppId } from '$lib/system/types';

	let cpu = 18;
	let ram = 41;
	let uptimeSeconds = 0;
	let cpuHistory: number[] = Array.from({ length: 24 }, () => 16 + Math.floor(Math.random() * 12));
	let ramHistory: number[] = Array.from({ length: 24 }, () => 38 + Math.floor(Math.random() * 10));
	let timer: ReturnType<typeof setInterval> | null = null;
	let activeTab: 'processes' | 'performance' | 'startup' = 'processes';
	let sortBy: 'name' | 'cpu' | 'ram' | 'z' = 'cpu';
	let search = '';
	let startupState: Partial<Record<AppId, boolean>> = {
		explorer: true,
		settings: true,
		notepad: true,
		terminal: false,
		browser: false,
		media: false,
		monitor: true
	};
	let processMetrics: Record<string, { cpu: number; ram: number }> = {};
	let previousProcessMetrics: Record<string, { cpu: number; ram: number }> = {};

	const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

	const nextValue = (current: number, volatility: number, min: number, max: number) => {
		const delta = Math.floor((Math.random() - 0.5) * volatility * 2);
		return clamp(current + delta, min, max);
	};

	const tick = () => {
		uptimeSeconds += 1;
		cpu = nextValue(cpu, 8, 4, 94);
		ram = nextValue(ram, 4, 22, 92);
		cpuHistory = [...cpuHistory.slice(1), cpu];
		ramHistory = [...ramHistory.slice(1), ram];
		const nextMetrics: Record<string, { cpu: number; ram: number }> = {};
		for (const process of openProcesses) {
			const prev = processMetrics[process.id] ?? { cpu: 1 + Math.floor(Math.random() * 8), ram: 2 + Math.floor(Math.random() * 14) };
			nextMetrics[process.id] = {
				cpu: nextValue(prev.cpu, 7, 1, 55),
				ram: nextValue(prev.ram, 4, 2, 72)
			};
		}
		previousProcessMetrics = processMetrics;
		processMetrics = nextMetrics;
	};

	$: openProcesses = [...$windows].sort((a, b) => b.zIndex - a.zIndex);
	$: runningProcesses = openProcesses.filter((item) => !item.minimized);
	$: totalProcesses = openProcesses.length;
	$: processGroups = Object.values(
		openProcesses.reduce(
			(acc, process) => {
				if (!acc[process.appId]) {
					acc[process.appId] = { appId: process.appId, windows: [], totalCpu: 0, totalRam: 0, topZ: process.zIndex };
				}
				acc[process.appId].windows.push(process);
				acc[process.appId].totalCpu += processMetrics[process.id]?.cpu ?? 0;
				acc[process.appId].totalRam += processMetrics[process.id]?.ram ?? 0;
				acc[process.appId].topZ = Math.max(acc[process.appId].topZ, process.zIndex);
				return acc;
			},
			{} as Record<
				AppId,
				{
					appId: AppId;
					windows: typeof openProcesses;
					totalCpu: number;
					totalRam: number;
					topZ: number;
				}
			>
		)
	);
	$: filteredGroups = processGroups.filter((group) => {
		const appName = APPS_REGISTRY[group.appId]?.name ?? group.appId;
		return !search.trim() || appName.toLowerCase().includes(search.toLowerCase());
	});
	$: sortedGroups = [...filteredGroups].sort((a, b) => {
		if (sortBy === 'name') return (APPS_REGISTRY[a.appId]?.name ?? a.appId).localeCompare(APPS_REGISTRY[b.appId]?.name ?? b.appId);
		if (sortBy === 'ram') return b.totalRam - a.totalRam;
		if (sortBy === 'z') return b.topZ - a.topZ;
		return b.totalCpu - a.totalCpu;
	});
	$: startupApps = (Object.keys(startupState) as AppId[]).map((appId) => ({
		appId,
		enabled: startupState[appId] ?? false,
		impact: (appId === 'explorer' || appId === 'monitor'
			? 'High'
			: appId === 'settings' || appId === 'notepad'
				? 'Medium'
				: 'Low') as 'High' | 'Medium' | 'Low'
	}));
	$: totalGroupedCpu = Math.round(sortedGroups.reduce((acc, group) => acc + group.totalCpu, 0));
	$: totalGroupedRam = Math.round(sortedGroups.reduce((acc, group) => acc + group.totalRam, 0));
	$: processRows = openProcesses
		.filter((process) => {
			const appName = APPS_REGISTRY[process.appId]?.name ?? process.appId;
			return !search.trim() || appName.toLowerCase().includes(search.toLowerCase());
		})
		.map((process) => {
			const metric = processMetrics[process.id] ?? { cpu: 0, ram: 0 };
			const prev = previousProcessMetrics[process.id] ?? metric;
			const delta = metric.cpu - prev.cpu;
			const trend = delta > 2 ? 'Rising' : delta < -2 ? 'Falling' : 'Stable';
			const powerUsage = metric.cpu > 35 ? 'Very high' : metric.cpu > 20 ? 'High' : metric.cpu > 10 ? 'Medium' : 'Low';
			return {
				process,
				appName: APPS_REGISTRY[process.appId]?.name ?? process.appId,
				cpu: metric.cpu,
				ram: metric.ram,
				trend,
				powerUsage,
				status: process.minimized ? 'Suspended' : process.focused ? 'Active' : 'Background'
			};
		})
		.sort((a, b) => {
			if (sortBy === 'name') return a.appName.localeCompare(b.appName);
			if (sortBy === 'ram') return b.ram - a.ram;
			if (sortBy === 'z') return b.process.zIndex - a.process.zIndex;
			return b.cpu - a.cpu;
		});

	const formatUptime = (seconds: number) => {
		const h = Math.floor(seconds / 3600)
			.toString()
			.padStart(2, '0');
		const m = Math.floor((seconds % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const s = Math.floor(seconds % 60)
			.toString()
			.padStart(2, '0');
		return `${h}:${m}:${s}`;
	};

	onMount(() => {
		timer = setInterval(tick, 1000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	const toggleStartup = (appId: AppId) => {
		startupState = { ...startupState, [appId]: !startupState[appId] };
	};

	const exportCsv = () => {
		const header = ['App', 'PID', 'Status', 'CPU %', 'RAM %', 'Power usage', 'Trend', 'Z-index'];
		const rows = processRows.map((row) => [
			row.appName,
			row.process.id,
			row.status,
			String(row.cpu),
			String(row.ram),
			row.powerUsage,
			row.trend,
			String(row.process.zIndex)
		]);
		const csv = [header, ...rows].map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `task-manager-processes-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
</script>

<div class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)] gap-3 p-3">
	<div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 p-2">
		<div class="flex gap-1">
			<button
				class={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'processes' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`}
				on:click={() => (activeTab = 'processes')}
			>
				Processes
			</button>
			<button
				class={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'performance' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`}
				on:click={() => (activeTab = 'performance')}
			>
				Performance
			</button>
			<button
				class={`rounded-lg px-3 py-1.5 text-sm ${activeTab === 'startup' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`}
				on:click={() => (activeTab = 'startup')}
			>
				Startup
			</button>
		</div>
		<div class="text-xs text-[var(--muted)]">Task Manager mode</div>
	</div>

	{#if activeTab === 'performance'}
		<div class="grid min-h-0 grid-rows-[auto_auto] gap-3 overflow-auto">
			<div class="grid gap-2 md:grid-cols-3">
				<div class="rounded-xl border border-white/15 bg-white/10 p-3">
					<div class="text-xs text-[var(--muted)]">CPU (mock live)</div>
					<div class="mt-1 text-2xl font-semibold">{cpu}%</div>
					<div class="mt-2 h-2 overflow-hidden rounded-full bg-black/25">
						<div class="h-full rounded-full bg-emerald-400 transition-all duration-300" style={`width:${cpu}%`}></div>
					</div>
				</div>
				<div class="rounded-xl border border-white/15 bg-white/10 p-3">
					<div class="text-xs text-[var(--muted)]">RAM (mock live)</div>
					<div class="mt-1 text-2xl font-semibold">{ram}%</div>
					<div class="mt-2 h-2 overflow-hidden rounded-full bg-black/25">
						<div class="h-full rounded-full bg-sky-400 transition-all duration-300" style={`width:${ram}%`}></div>
					</div>
				</div>
				<div class="rounded-xl border border-white/15 bg-white/10 p-3">
					<div class="text-xs text-[var(--muted)]">Session Uptime</div>
					<div class="mt-1 text-2xl font-semibold">{formatUptime(uptimeSeconds)}</div>
					<div class="mt-2 text-xs text-[var(--muted)]">{runningProcesses.length} running / {totalProcesses} total windows</div>
				</div>
			</div>

			<div class="grid gap-2 md:grid-cols-2">
				<div class="rounded-xl border border-white/15 bg-white/10 p-3">
					<div class="mb-2 text-sm font-medium">CPU Timeline</div>
					<div class="flex h-20 items-end gap-1 rounded-lg bg-black/15 p-2">
						{#each cpuHistory as point}
							<div class="flex-1 rounded-sm bg-emerald-400/80" style={`height:${Math.max(4, point)}%`} title={`${point}%`}></div>
						{/each}
					</div>
				</div>
				<div class="rounded-xl border border-white/15 bg-white/10 p-3">
					<div class="mb-2 text-sm font-medium">RAM Timeline</div>
					<div class="flex h-20 items-end gap-1 rounded-lg bg-black/15 p-2">
						{#each ramHistory as point}
							<div class="flex-1 rounded-sm bg-sky-400/80" style={`height:${Math.max(4, point)}%`} title={`${point}%`}></div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'startup'}
		<div class="min-h-0 rounded-xl border border-white/15 bg-white/10 p-3">
			<div class="mb-2 text-sm text-[var(--muted)]">Enable or disable startup apps (mock startup manager).</div>
			<div class="grid max-h-full gap-1 overflow-auto">
				{#each startupApps as app}
					<div class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg bg-black/10 px-3 py-2">
						<div class="grid h-7 w-7 place-items-center rounded-md bg-white/15">
							<AppIcon appId={app.appId} size={14} />
						</div>
						<div>
							<div class="font-medium">{APPS_REGISTRY[app.appId]?.name ?? app.appId}</div>
							<div class="text-xs text-[var(--muted)]">Impact: {app.impact}</div>
						</div>
						<div class="text-xs">{app.enabled ? 'Enabled' : 'Disabled'}</div>
						<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => toggleStartup(app.appId)}>
							Toggle
						</button>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-2 rounded-xl border border-white/15 bg-white/10 p-3">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="text-sm font-medium">Open Processes ({totalProcesses})</div>
				<div class="text-xs text-[var(--muted)]">Group kill + search + sorting</div>
			</div>
			<div class="flex flex-wrap gap-2">
				<input
					class="min-w-44 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm outline-none"
					placeholder="Search process..."
					bind:value={search}
				/>
				<select class="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm" bind:value={sortBy}>
					<option value="cpu">Sort by CPU</option>
					<option value="ram">Sort by RAM</option>
					<option value="name">Sort by Name</option>
					<option value="z">Sort by Z-index</option>
				</select>
				<div class="rounded-lg bg-white/10 px-3 py-1.5 text-xs">CPU sum: {totalGroupedCpu}%</div>
				<div class="rounded-lg bg-white/10 px-3 py-1.5 text-xs">RAM sum: {totalGroupedRam}%</div>
				<button class="rounded-lg bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25" on:click={exportCsv}>
					Export CSV
				</button>
			</div>
			<div class="grid max-h-full gap-1 overflow-auto">
				{#if !processRows.length}
					<div class="rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">No matching process groups.</div>
				{:else}
					<div class="grid grid-cols-[180px_1fr_72px_72px_94px_96px_82px_100px] items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">
						<div>App</div>
						<div>PID</div>
						<div>Status</div>
						<div>CPU</div>
						<div>RAM</div>
						<div>Power usage</div>
						<div>Trend</div>
						<div>Actions</div>
					</div>
					{#each processRows as row}
						<div class="grid grid-cols-[180px_1fr_72px_72px_94px_96px_82px_100px] items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-xs">
							<div class="flex items-center gap-2">
								<div class="grid h-7 w-7 place-items-center rounded-md bg-white/15">
									<AppIcon appId={row.process.appId} size={13} />
								</div>
								<div class="truncate">{row.appName}</div>
							</div>
							<div class="truncate text-[var(--muted)]">{row.process.id.slice(0, 18)}</div>
							<div>{row.status}</div>
							<div>{row.cpu}%</div>
							<div>{row.ram}%</div>
							<div>{row.powerUsage}</div>
							<div>{row.trend}</div>
							<div class="flex gap-1">
								<button class="rounded bg-white/15 px-1.5 py-0.5 hover:bg-white/25" on:click={() => focusWindow(row.process.id)}>F</button>
								<button class="rounded bg-white/15 px-1.5 py-0.5 hover:bg-white/25" on:click={() => minimizeWindow(row.process.id)}>M</button>
								<button class="rounded bg-red-500/35 px-1.5 py-0.5 hover:bg-red-500/55" on:click={() => closeWindow(row.process.id)}>X</button>
							</div>
						</div>
					{/each}
					<div class="my-1 h-px bg-white/10"></div>
					<div class="mb-1 text-xs text-[var(--muted)]">Grouped actions</div>
					{#each sortedGroups as group}
						<div class="rounded-lg bg-black/10 px-3 py-2">
							<div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
								<div class="grid h-8 w-8 place-items-center rounded-md bg-white/15">
									<AppIcon appId={group.appId} size={15} />
								</div>
								<div>
									<div class="font-medium">{APPS_REGISTRY[group.appId]?.name ?? group.appId} ({group.windows.length})</div>
									<div class="text-xs text-[var(--muted)]">
										CPU: {Math.round(group.totalCpu)}% | RAM: {Math.round(group.totalRam)}% | top z: {group.topZ}
									</div>
								</div>
								<div class="flex gap-1">
									<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => focusWindow(group.windows[0].id)}>
										Focus
									</button>
									<button class="rounded-md bg-red-500/30 px-2 py-1 text-xs hover:bg-red-500/50" on:click={() => closeAppGroup(group.appId)}>
										Kill group
									</button>
								</div>
							</div>
							<div class="mt-2 grid gap-1">
								{#each group.windows as process}
									<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md bg-black/20 px-2 py-1.5">
										<div class="text-xs text-[var(--muted)]">
											PID: {process.id.slice(0, 12)} | cpu: {processMetrics[process.id]?.cpu ?? 0}% | ram: {processMetrics[process.id]?.ram ?? 0}% | {process.minimized ? 'Minimized' : process.focused ? 'Focused' : 'Background'}
										</div>
										<div class="flex gap-1">
											<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => focusWindow(process.id)}>Focus</button>
											<button class="rounded-md bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={() => minimizeWindow(process.id)}>Min</button>
											<button class="rounded-md bg-red-500/30 px-2 py-1 text-xs hover:bg-red-500/50" on:click={() => closeWindow(process.id)}>Close</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
