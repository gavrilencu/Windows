<svelte:options runes={false} />

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { APP_LIST } from '$lib/apps/registry';
	import AppIcon from '$lib/components/common/AppIcon.svelte';
	import WindowThumbnailCanvas from '$lib/components/os/WindowThumbnailCanvas.svelte';
	import {
		calendarFlyoutOpen,
		clipboardFlyoutOpen,
		networkFlyoutOpen,
		pinnedApps,
		reorderPinnedApps,
		closeWindow,
		focusWindow,
		minimizeWindow,
		quickPanelOpen,
		setPeekWindow,
		toggleNotificationCenter,
		toggleCalendarFlyout,
		toggleClipboardFlyout,
		toggleNetworkFlyout,
		toggleQuickPanel,
		toggleStartMenu,
		toggleTaskbarApp,
		toggleVolumeFlyout,
		volumeFlyoutOpen,
		windows
	} from '$lib/stores/windows';
	import { volumeLevel, wifiEnabled } from '$lib/stores/systemState';
	import { appOpenCount } from '$lib/system/windowManager';
	import { AppWindow, Bell, BatteryMedium, CalendarDays, ClipboardList, SlidersHorizontal, Volume2, Wifi } from 'lucide-svelte';

	let now = new Date();
	let timer: ReturnType<typeof setInterval> | null = null;
	let draggingApp: (typeof APP_LIST)[number]['id'] | null = null;
	let hoveredApp: (typeof APP_LIST)[number]['id'] | null = null;
	let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

	$: previewWindows = hoveredApp
		? [...$windows].filter((win) => win.appId === hoveredApp).sort((a, b) => b.zIndex - a.zIndex)
		: [];
	$: pinnedAppList = $pinnedApps
		.map((id) => APP_LIST.find((app) => app.id === id))
		.filter((app): app is (typeof APP_LIST)[number] => Boolean(app));

	const openPreview = (appId: (typeof APP_LIST)[number]['id']) => {
		if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
		hoveredApp = appId;
	};

	const closePreviewSoon = () => {
		if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
		setPeekWindow(null);
		hoverCloseTimer = setTimeout(() => {
			hoveredApp = null;
		}, 120);
	};

	onMount(() => {
		timer = setInterval(() => (now = new Date()), 10000);
	});
	onDestroy(() => {
		if (timer) clearInterval(timer);
		if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
		setPeekWindow(null);
	});
</script>

<div
	class="taskbar-root glass absolute bottom-2.5 left-1/2 z-50 flex h-[52px] min-w-[min(92vw,980px)] -translate-x-1/2 items-center justify-between rounded-2xl px-2"
>
	{#if hoveredApp && previewWindows.length}
		<div
			class="absolute -top-2 left-1/2 z-10 min-w-[320px] -translate-x-1/2 -translate-y-full rounded-xl border border-white/20 bg-[rgba(20,24,36,0.9)] p-2 shadow-2xl backdrop-blur-xl"
			role="dialog"
			tabindex="0"
			on:mouseenter={() => hoveredApp && openPreview(hoveredApp)}
			on:mouseleave={closePreviewSoon}
			in:fade={{ duration: 180 }}
			out:fade={{ duration: 120 }}
		>
			<div class="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
				<div class="flex items-center gap-1.5">
					<span>{APP_LIST.find((a) => a.id === hoveredApp)?.name}</span>
					<span class="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] text-white">{previewWindows.length}</span>
				</div>
				<span>Group preview</span>
			</div>
			<div class="grid gap-2">
				{#each previewWindows as win}
					<div
						class="group rounded-lg bg-white/10 p-1.5 transition hover:bg-white/15"
						role="group"
						on:mouseenter={() => setPeekWindow(win.id)}
						on:mouseleave={() => setPeekWindow(null)}
					>
						<WindowThumbnailCanvas windowFrame={win} appName={APP_LIST.find((a) => a.id === win.appId)?.name ?? win.appId} />
						<div class="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
							<div class="min-w-0 px-1">
								<div class="truncate text-xs">{win.title}</div>
								<div class="text-[10px] text-[var(--muted)]">{win.minimized ? 'Minimized' : win.focused ? 'Focused' : 'Background'}</div>
							</div>
							<div class="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
								<button class="rounded bg-white/15 px-1.5 py-0.5 text-[10px] hover:bg-white/25" on:click={() => focusWindow(win.id)}>Open</button>
								<button class="rounded bg-white/15 px-1.5 py-0.5 text-[10px] hover:bg-white/25" on:click={() => minimizeWindow(win.id)}>Min</button>
								<button class="rounded bg-red-500/35 px-1.5 py-0.5 text-[10px] hover:bg-red-500/55" on:click={() => closeWindow(win.id)}>X</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mx-auto flex items-center gap-1.5">
		<button class="relative grid h-9 w-9 place-items-center rounded-[10px] bg-white/10 text-[var(--text)] hover:bg-white/20" on:click={toggleStartMenu}><AppWindow size={18} class="mx-auto" /></button>
		{#each pinnedAppList as app}
			<button
				class={`relative grid h-9 w-9 place-items-center rounded-[10px] text-[var(--text)] transition-all duration-150 ${
					appOpenCount($windows, app.id) ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
				}`}
				title={app.name}
				draggable="true"
				on:click={() => toggleTaskbarApp(app.id)}
				on:mouseenter={() => (appOpenCount($windows, app.id) ? openPreview(app.id) : null)}
				on:mouseleave={closePreviewSoon}
				on:dragstart={() => (draggingApp = app.id)}
				on:dragover|preventDefault
				on:drop={() => {
					if (draggingApp) reorderPinnedApps(draggingApp, app.id);
					draggingApp = null;
				}}
				on:dragend={() => (draggingApp = null)}
			>
				<AppIcon appId={app.id} size={17} />
				{#if appOpenCount($windows, app.id)}
					<i class="absolute bottom-[3px] left-1/2 h-[3px] w-3.5 -translate-x-1/2 rounded-full bg-[var(--accent)]"></i>
					{#if appOpenCount($windows, app.id) > 1}
						<span class="absolute -right-1 -top-1 rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
							{appOpenCount($windows, app.id)}
						</span>
					{/if}
				{/if}
			</button>
		{/each}
	</div>
	<div class="flex items-center gap-2 text-xs text-[var(--muted)]">
		<button class={`rounded px-1 py-0.5 hover:text-[var(--text)] ${$calendarFlyoutOpen ? 'text-[var(--text)]' : ''}`} on:click={toggleCalendarFlyout}>
			{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
		</button>
		<button class={`hover:text-[var(--text)] ${$clipboardFlyoutOpen ? 'text-[var(--text)]' : ''}`} on:click={toggleClipboardFlyout} title="Clipboard history (Win+V)">
			<ClipboardList size={15} />
		</button>
		<button
			class={`text-[var(--muted)] hover:text-[var(--text)] ${$quickPanelOpen ? 'text-[var(--text)]' : ''}`}
			on:click={toggleQuickPanel}
		>
			<SlidersHorizontal size={15} />
		</button>
		<button class="text-[var(--muted)] hover:text-[var(--text)]" on:click={toggleNotificationCenter}><Bell size={15} /></button>
		<button class={`hover:text-[var(--text)] ${$networkFlyoutOpen ? 'text-[var(--text)]' : ''}`} on:click={toggleNetworkFlyout} title={$wifiEnabled ? 'Wi-Fi on' : 'Wi-Fi off'}>
			<Wifi size={15} />
		</button>
		<button class={`hover:text-[var(--text)] ${$volumeFlyoutOpen ? 'text-[var(--text)]' : ''}`} on:click={toggleVolumeFlyout} title={`Volume ${$volumeLevel}%`}>
			<Volume2 size={15} />
		</button>
		<div title="Battery"><BatteryMedium size={15} /></div>
		<CalendarDays size={14} class="opacity-65" />
	</div>
</div>
