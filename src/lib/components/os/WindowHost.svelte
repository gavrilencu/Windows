<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { APPS_REGISTRY, APP_COMPONENTS } from '$lib/apps/registry';
	import {
		closeWindow,
		focusWindow,
		maximizeWindow,
		minimizeWindow,
		peekedWindowId,
		snapWindowLayout,
		updateWindowGeometry,
		windows
	} from '$lib/stores/windows';
	import type { AppId, WindowFrame } from '$lib/system/types';

	const loadedComponents = writable<Partial<Record<AppId, any>>>({});
	let resizing: { id: string; edge: string } | null = null;
	let dragging: { id: string; offsetX: number; offsetY: number } | null = null;
	let snapPickerWindowId: string | null = null;
	let snapCloseTimer: ReturnType<typeof setTimeout> | null = null;

	async function ensureComponent(appId: AppId): Promise<void> {
		if (get(loadedComponents)[appId]) return;
		const mod = await APP_COMPONENTS[appId]();
		loadedComponents.update((prev) => ({ ...prev, [appId]: mod.default }));
	}

	$: {
		for (const win of $windows) {
			void ensureComponent(win.appId);
		}
	}

	const startDrag = (e: PointerEvent, win: WindowFrame) => {
		if (win.maximized) return;
		dragging = { id: win.id, offsetX: e.clientX - win.x, offsetY: e.clientY - win.y };
		focusWindow(win.id);
	};

	const startResize = (e: PointerEvent, id: string, edge: string) => {
		e.stopPropagation();
		resizing = { id, edge };
		focusWindow(id);
	};

	const onPointerMove = (e: PointerEvent) => {
		if (dragging) {
			const x = e.clientX - dragging.offsetX;
			const y = e.clientY - dragging.offsetY;
			updateWindowGeometry(dragging.id, { x, y, snapped: undefined });
		}
		if (resizing) {
			const win = $windows.find((w) => w.id === resizing?.id);
			if (!win || win.maximized) return;
			const minW = APPS_REGISTRY[win.appId].minWidth;
			const minH = APPS_REGISTRY[win.appId].minHeight;

			if (resizing.edge.includes('right')) {
				updateWindowGeometry(win.id, { width: Math.max(minW, e.clientX - win.x) });
			}
			if (resizing.edge.includes('bottom')) {
				updateWindowGeometry(win.id, { height: Math.max(minH, e.clientY - win.y) });
			}
		}
	};

	const onPointerUp = () => {
		if (dragging) {
			const win = $windows.find((w) => w.id === dragging?.id);
			if (win) {
				if (win.y < 16) maximizeWindow(win.id);
				else if (win.x < 12) snapWindowLayout(win.id, 'left');
				else if (win.x + win.width > window.innerWidth - 12) snapWindowLayout(win.id, 'right');
			}
		}
		dragging = null;
		resizing = null;
	};

	onMount(() => {
		const listenerMove = (e: PointerEvent) => onPointerMove(e);
		const listenerUp = () => onPointerUp();
		window.addEventListener('pointermove', listenerMove);
		window.addEventListener('pointerup', listenerUp);
		return () => {
			window.removeEventListener('pointermove', listenerMove);
			window.removeEventListener('pointerup', listenerUp);
			if (snapCloseTimer) clearTimeout(snapCloseTimer);
		};
	});

	const openSnapPicker = (id: string) => {
		if (snapCloseTimer) clearTimeout(snapCloseTimer);
		snapPickerWindowId = id;
	};

	const closeSnapPickerSoon = () => {
		if (snapCloseTimer) clearTimeout(snapCloseTimer);
		snapCloseTimer = setTimeout(() => {
			snapPickerWindowId = null;
		}, 120);
	};

	const applySnap = (id: string, layout: 'left' | 'right' | 'top-left' | 'top-right') => {
		snapWindowLayout(id, layout);
		snapPickerWindowId = null;
	};
</script>

{#each [...$windows].sort((a, b) => a.zIndex - b.zIndex) as win (win.id)}
	{#if !win.minimized}
		{@const app = APPS_REGISTRY[win.appId]}
		{@const AppComponent = $loadedComponents[win.appId]}
		<div
			class={`glass absolute grid overflow-hidden ${
				win.maximized ? 'rounded-none' : 'rounded-2xl'
			} grid-rows-[auto_minmax(0,1fr)] ${
				$peekedWindowId === win.id
					? 'ring-2 ring-sky-300 shadow-[0_0_0_2px_rgba(125,211,252,0.35)]'
					: win.focused
						? 'ring-1 ring-white/35'
						: 'opacity-95'
			}`}
			style={`left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px;z-index:${win.zIndex}`}
			role="dialog"
			tabindex="0"
			on:mousedown={() => focusWindow(win.id)}
		>
			<div
				class="flex cursor-move select-none items-center justify-between bg-black/30 px-3 py-2"
				role="button"
				tabindex="0"
				on:pointerdown={(e) => startDrag(e, win)}
				on:dblclick={() => maximizeWindow(win.id)}
				on:keydown={(e) => e.key === 'Enter' && maximizeWindow(win.id)}
			>
				<span>{win.title}</span>
				<div class="flex gap-1">
					<button class="h-6 w-7 rounded-md bg-white/10 hover:bg-white/20" on:pointerdown|stopPropagation on:click|stopPropagation={() => minimizeWindow(win.id)}>_</button>
					<div class="relative" role="group" on:mouseenter={() => openSnapPicker(win.id)} on:mouseleave={closeSnapPickerSoon}>
						<button
							class="h-6 w-7 rounded-md bg-white/10 hover:bg-white/20"
							on:pointerdown|stopPropagation
							on:click|stopPropagation={() => maximizeWindow(win.id)}
						>
							▢
						</button>
						{#if snapPickerWindowId === win.id}
							<div
								class="absolute right-0 top-7 z-20 w-40 rounded-xl border border-white/20 bg-[rgba(24,30,46,0.95)] p-2 shadow-2xl backdrop-blur-xl"
								role="group"
								on:mouseenter={() => openSnapPicker(win.id)}
								on:mouseleave={closeSnapPickerSoon}
							>
								<div class="mb-1 text-[10px] text-[var(--muted)]">Snap layout</div>
								<div class="grid grid-cols-2 gap-1">
									<button class="h-7 rounded bg-white/10 hover:bg-white/20" on:click|stopPropagation={() => applySnap(win.id, 'left')}>L</button>
									<button class="h-7 rounded bg-white/10 hover:bg-white/20" on:click|stopPropagation={() => applySnap(win.id, 'right')}>R</button>
									<button class="h-7 rounded bg-white/10 hover:bg-white/20" on:click|stopPropagation={() => applySnap(win.id, 'top-left')}>TL</button>
									<button class="h-7 rounded bg-white/10 hover:bg-white/20" on:click|stopPropagation={() => applySnap(win.id, 'top-right')}>TR</button>
									<button class="col-span-2 h-7 rounded bg-white/10 hover:bg-white/20" on:click|stopPropagation={() => {
										maximizeWindow(win.id);
										snapPickerWindowId = null;
									}}>Maximize</button>
								</div>
							</div>
						{/if}
					</div>
					<button class="h-6 w-7 rounded-md bg-white/10 hover:bg-red-500" on:pointerdown|stopPropagation on:click|stopPropagation={() => closeWindow(win.id)}>✕</button>
				</div>
			</div>
			<div class="h-full min-h-0 overflow-hidden bg-[var(--surface)]">
				{#if !AppComponent}
					<div class="grid h-full place-items-center text-sm text-[var(--muted)]">Loading {app.name}...</div>
				{:else}
					<svelte:component this={AppComponent} windowId={win.id} payload={win.payload ?? {}} />
				{/if}
			</div>
			<button
				class="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize border-0 bg-transparent p-0"
				aria-label="Resize window corner"
				on:pointerdown={(e) => startResize(e, win.id, 'bottom-right')}
			></button>
			<button
				class="absolute right-0 top-[30%] h-[40%] w-2 cursor-ew-resize border-0 bg-transparent p-0"
				aria-label="Resize window right"
				on:pointerdown={(e) => startResize(e, win.id, 'right')}
			></button>
			<button
				class="absolute bottom-0 left-[30%] h-2 w-[40%] cursor-ns-resize border-0 bg-transparent p-0"
				aria-label="Resize window bottom"
				on:pointerdown={(e) => startResize(e, win.id, 'bottom')}
			></button>
		</div>
	{/if}
{/each}
