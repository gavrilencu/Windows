<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { accentColor, lockscreenWallpaper, theme, updatePin, updatePreferences, wallpaper } from '$lib/stores/session';
	import { pushNotification } from '$lib/stores/notifications';
	import type { ThemeMode } from '$lib/system/types';
	import { WALLPAPER_PRESETS, randomWallpaper, type WallpaperPreset } from '$lib/system/wallpapers';
	import { getSQLiteSyncStatus, pullStateFromSQLite, pushLocalStateToSQLite, type SyncStatus } from '$lib/system/sync';
	import {
		Accessibility,
		Bell,
		Gamepad2,
		Languages,
		MonitorSmartphone,
		Search,
		Shield,
		User,
		Wallpaper,
		Wifi
	} from 'lucide-svelte';

	type Target = 'desktop' | 'lock';
	type SettingsSection = 'system' | 'personalization' | 'accounts' | 'network' | 'gaming' | 'accessibility' | 'update';

	let query = '';
	let settingsSearch = '';
	let category: WallpaperPreset['category'] | 'All' = 'All';
	let target: Target = 'desktop';
	let currentSection: SettingsSection = 'system';
	let customDesktopUrl = '';
	let customLockUrl = '';
	let syncStatus: SyncStatus | null = null;
	let syncBusy = false;
	let oldPin = '';
	let newPin = '';
	let pinBusy = false;
	let wifiEnabled = true;
	let bluetoothEnabled = true;
	let gameMode = true;
	let contrastMode = false;
	let notificationsEnabled = true;

	$: filteredWallpapers = WALLPAPER_PRESETS.filter((item) => {
		const matchesQuery = !query.trim() || item.name.toLowerCase().includes(query.toLowerCase());
		const matchesCategory = category === 'All' || item.category === category;
		return matchesQuery && matchesCategory;
	});

	const switchTheme = async (mode: ThemeMode) => updatePreferences({ theme: mode });
	const pickWallpaper = async (url: string) => updatePreferences({ wallpaper: url });
	const pickLockscreen = async (url: string) => updatePreferences({ lockscreenWallpaper: url });
	const applyToTarget = async (url: string) => (target === 'desktop' ? pickWallpaper(url) : pickLockscreen(url));
	const applyRandom = async () => applyToTarget(randomWallpaper(category === 'All' ? undefined : category).url);
	const syncLockWithDesktop = async () => updatePreferences({ lockscreenWallpaper: $wallpaper });
	const syncDesktopWithLock = async () => updatePreferences({ wallpaper: $lockscreenWallpaper });

	const applyCustom = async (value: string, to: Target) => {
		const trimmed = value.trim();
		if (!trimmed) return;
		if (to === 'desktop') {
			await pickWallpaper(trimmed);
			customDesktopUrl = '';
		} else {
			await pickLockscreen(trimmed);
			customLockUrl = '';
		}
	};

	const uploadLocalImage = async (event: Event, to: Target) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async () => {
			const value = String(reader.result ?? '');
			if (!value) return;
			if (to === 'desktop') await pickWallpaper(value);
			else await pickLockscreen(value);
		};
		reader.readAsDataURL(file);
	};

	const refreshSyncStatus = async () => {
		syncStatus = await getSQLiteSyncStatus();
	};

	const pushToSQLite = async () => {
		syncBusy = true;
		try {
			await pushLocalStateToSQLite();
			await refreshSyncStatus();
			await pushNotification({
				title: 'SQLite sync',
				message: 'Local state pushed to SQLite snapshot.',
				type: 'success'
			});
		} catch (error) {
			await pushNotification({
				title: 'SQLite sync failed',
				message: error instanceof Error ? error.message : 'Unknown SQLite push error',
				type: 'error'
			});
		} finally {
			syncBusy = false;
		}
	};

	const pullFromSQLite = async () => {
		syncBusy = true;
		try {
			const imported = await pullStateFromSQLite();
			await refreshSyncStatus();
			await pushNotification({
				title: 'SQLite restore',
				message: imported ? 'State restored from SQLite snapshot.' : 'No snapshot in SQLite yet.',
				type: imported ? 'success' : 'info'
			});
		} catch (error) {
			await pushNotification({
				title: 'SQLite restore failed',
				message: error instanceof Error ? error.message : 'Unknown SQLite pull error',
				type: 'error'
			});
		} finally {
			syncBusy = false;
		}
	};

	const changePin = async () => {
		if (!oldPin.trim() || !newPin.trim()) {
			await pushNotification({
				title: 'Security',
				message: 'Enter both current and new PIN.',
				type: 'warning'
			});
			return;
		}
		pinBusy = true;
		try {
			const ok = await updatePin(oldPin, newPin);
			if (!ok) {
				await pushNotification({
					title: 'Security',
					message: 'Current PIN/password is invalid.',
					type: 'error'
				});
				return;
			}
			oldPin = '';
			newPin = '';
			await pushNotification({
				title: 'Security',
				message: 'PIN updated successfully.',
				type: 'success'
			});
		} finally {
			pinBusy = false;
		}
	};

	onMount(() => {
		void refreshSyncStatus();
	});
</script>

<div class="h-full w-full overflow-auto p-4">
	<div class="grid h-full min-h-0 grid-cols-[260px_minmax(0,1fr)] gap-3">
		<aside class="rounded-2xl border border-white/15 bg-white/10 p-3">
			<div class="mb-3 flex items-center gap-3 rounded-xl bg-white/10 p-2">
				<div class="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-white">U</div>
				<div>
					<div class="text-sm font-semibold">User</div>
					<div class="text-xs text-[var(--muted)]">Local account</div>
				</div>
			</div>
			<div class="relative mb-3">
				<Search size={14} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
				<input
					class="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-sm outline-none"
					placeholder="Find a setting"
					bind:value={settingsSearch}
				/>
			</div>
			<div class="grid gap-1">
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'system' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'system')}><MonitorSmartphone size={15} />System</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'personalization' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'personalization')}><Wallpaper size={15} />Personalization</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'accounts' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'accounts')}><User size={15} />Accounts</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'network' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'network')}><Wifi size={15} />Network & Internet</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'gaming' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'gaming')}><Gamepad2 size={15} />Gaming</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'accessibility' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'accessibility')}><Accessibility size={15} />Accessibility</button>
				<button class={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === 'update' ? 'bg-white/25' : 'hover:bg-white/15'}`} on:click={() => (currentSection = 'update')}><Shield size={15} />Windows Update</button>
			</div>
		</aside>

		<section class="min-h-0 overflow-auto rounded-2xl border border-white/15 bg-white/10 p-4">
			{#if currentSection === 'system'}
				<h2 class="mb-3 text-xl font-semibold">System</h2>
				<div class="grid gap-3 md:grid-cols-2">
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="text-sm font-medium">Theme</div>
						<div class="mt-2 flex gap-2">
							<button class={`rounded-lg px-3 py-1.5 ${$theme === 'light' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`} on:click={() => switchTheme('light')}>Light</button>
							<button class={`rounded-lg px-3 py-1.5 ${$theme === 'dark' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`} on:click={() => switchTheme('dark')}>Dark</button>
						</div>
					</div>
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="text-sm font-medium">Accent color</div>
						<input class="mt-2 h-10 w-20 rounded-md border border-white/20 bg-transparent p-1" type="color" bind:value={$accentColor} on:change={(e) => updatePreferences({ accentColor: (e.target as HTMLInputElement).value })} />
					</div>
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="mb-1 text-sm font-medium">Notifications</div>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={() => (notificationsEnabled = !notificationsEnabled)}>
							{notificationsEnabled ? 'On' : 'Off'}
						</button>
					</div>
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="mb-1 text-sm font-medium">Language & region</div>
						<div class="flex items-center gap-2 text-sm text-[var(--muted)]"><Languages size={14} /> English (United States)</div>
					</div>
				</div>
			{:else if currentSection === 'accounts'}
				<h2 class="mb-3 text-xl font-semibold">Accounts</h2>
				<div class="grid gap-3">
					<div class="grid gap-2 rounded-xl border border-white/15 bg-white/10 p-4">
						<h3 class="font-medium">Security Center</h3>
						<p class="text-sm text-[var(--muted)]">Change lock PIN used by login screen.</p>
						<div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
							<input class="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" type="password" placeholder="Current PIN/password" bind:value={oldPin} />
							<input class="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" type="password" placeholder="New PIN" bind:value={newPin} />
							<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 disabled:opacity-60" disabled={pinBusy} on:click={changePin}>
								{pinBusy ? 'Updating...' : 'Update PIN'}
							</button>
						</div>
					</div>
				</div>
			{:else if currentSection === 'network'}
				<h2 class="mb-3 text-xl font-semibold">Network & Internet</h2>
				<div class="grid gap-3 md:grid-cols-2">
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="mb-1 flex items-center gap-2 text-sm font-medium"><Wifi size={14} />Wi-Fi</div>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={() => (wifiEnabled = !wifiEnabled)}>{wifiEnabled ? 'Connected' : 'Disconnected'}</button>
					</div>
					<div class="rounded-xl border border-white/15 bg-white/10 p-4">
						<div class="mb-1 text-sm font-medium">Bluetooth</div>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={() => (bluetoothEnabled = !bluetoothEnabled)}>{bluetoothEnabled ? 'On' : 'Off'}</button>
					</div>
				</div>
			{:else if currentSection === 'gaming'}
				<h2 class="mb-3 text-xl font-semibold">Gaming</h2>
				<div class="rounded-xl border border-white/15 bg-white/10 p-4">
					<div class="mb-2 text-sm font-medium">Game Mode</div>
					<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={() => (gameMode = !gameMode)}>{gameMode ? 'Enabled' : 'Disabled'}</button>
				</div>
			{:else if currentSection === 'accessibility'}
				<h2 class="mb-3 text-xl font-semibold">Accessibility</h2>
				<div class="rounded-xl border border-white/15 bg-white/10 p-4">
					<div class="mb-2 text-sm font-medium">High contrast</div>
					<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={() => (contrastMode = !contrastMode)}>{contrastMode ? 'Enabled' : 'Disabled'}</button>
				</div>
			{:else if currentSection === 'update'}
				<h2 class="mb-3 text-xl font-semibold">Windows Update</h2>
				<div class="grid gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
					<div class="flex items-center gap-2 text-sm"><Bell size={14} /> Last checked just now.</div>
					<p class="text-sm text-[var(--muted)]">Persist and restore full OS state using SQLite snapshots.</p>
					<div class="grid gap-2 rounded-lg border border-white/15 bg-white/5 p-3 text-sm">
						<div>
							<strong>Status:</strong>
							{#if !syncStatus}
								<span class="text-[var(--muted)]"> loading...</span>
							{:else if syncStatus.hasSnapshot}
								<span> snapshots: {syncStatus.snapshotCount}, last: {new Date(syncStatus.lastSyncedAt ?? 0).toLocaleString()}</span>
							{:else}
								<span class="text-[var(--muted)]"> no snapshots yet</span>
							{/if}
						</div>
						<div class="flex flex-wrap gap-2">
							<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 disabled:opacity-60" disabled={syncBusy} on:click={pushToSQLite}>
								{syncBusy ? 'Working...' : 'Push local state -> SQLite'}
							</button>
							<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25 disabled:opacity-60" disabled={syncBusy} on:click={pullFromSQLite}>
								{syncBusy ? 'Working...' : 'Pull SQLite -> local state'}
							</button>
							<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={refreshSyncStatus}>Refresh status</button>
						</div>
					</div>
				</div>
			{:else}
				<h2 class="mb-3 text-xl font-semibold">Personalization</h2>
				<div class="grid gap-3 rounded-xl border border-white/15 bg-white/10 p-4">
					<div class="flex flex-wrap items-center gap-2">
						<h3 class="mr-2 font-medium">Background</h3>
						<div class="rounded-md bg-white/15 px-2 py-1 text-xs">{WALLPAPER_PRESETS.length} wallpapers</div>
						<button class={`rounded-lg px-3 py-1.5 text-sm ${target === 'desktop' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`} on:click={() => (target = 'desktop')}>Desktop target</button>
						<button class={`rounded-lg px-3 py-1.5 text-sm ${target === 'lock' ? 'bg-[var(--accent)] text-white' : 'bg-white/15 hover:bg-white/25'}`} on:click={() => (target = 'lock')}>Lock target</button>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={applyRandom}>Random for current target</button>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={syncLockWithDesktop}>Desktop -> Lock</button>
						<button class="rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" on:click={syncDesktopWithLock}>Lock -> Desktop</button>
					</div>
					<div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
						<div class="rounded-xl border border-white/15 bg-white/5 p-2">
							<div class="mb-2 text-xs text-[var(--muted)]">Desktop preview</div>
							<button class="h-40 w-full rounded-lg border border-white/20 bg-cover bg-center" style={`background-image:url(${$wallpaper})`} on:click={() => applyToTarget($wallpaper)} aria-label="Current desktop wallpaper"></button>
						</div>
						<div class="rounded-xl border border-white/15 bg-white/5 p-2">
							<div class="mb-2 text-xs text-[var(--muted)]">Lock preview</div>
							<button class="h-40 w-full rounded-lg border border-white/20 bg-cover bg-center" style={`background-image:url(${$lockscreenWallpaper})`} on:click={() => applyToTarget($lockscreenWallpaper)} aria-label="Current lockscreen wallpaper"></button>
						</div>
					</div>
					<div class="flex flex-wrap gap-2">
						<input class="min-w-52 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" placeholder="Search wallpaper..." bind:value={query} />
						<select class="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" bind:value={category}>
							<option value="All">All categories</option>
							<option value="Nature">Nature</option>
							<option value="City">City</option>
							<option value="Abstract">Abstract</option>
							<option value="Space">Space</option>
							<option value="Minimal">Minimal</option>
						</select>
					</div>
					<div class="grid max-h-[380px] grid-cols-2 gap-2 overflow-auto rounded-xl border border-white/15 bg-black/10 p-2 md:grid-cols-3 lg:grid-cols-4">
						{#each filteredWallpapers as sample}
							<button class="group rounded-lg border border-white/20 bg-cover bg-center p-1 text-left" style={`background-image:url(${sample.thumbnail})`} on:click={() => applyToTarget(sample.url)} aria-label={`Apply ${sample.name}`}>
								<div class="mt-20 rounded bg-black/45 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
									<div>{sample.name}</div>
									<div class="text-[10px] text-white/80">{sample.category}</div>
								</div>
							</button>
						{/each}
						{#if !filteredWallpapers.length}
							<div class="col-span-full rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">No wallpapers found for this filter.</div>
						{/if}
					</div>
					<div class="grid gap-2 md:grid-cols-2">
						<div class="grid gap-2 rounded-lg border border-white/15 bg-white/5 p-3">
							<div class="text-sm font-medium">Custom desktop image</div>
							<div class="flex gap-2">
								<input class="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" placeholder="https://..." bind:value={customDesktopUrl} />
								<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => applyCustom(customDesktopUrl, 'desktop')}>Apply</button>
							</div>
							<input class="text-xs" type="file" accept="image/*" on:change={(e) => uploadLocalImage(e, 'desktop')} />
						</div>
						<div class="grid gap-2 rounded-lg border border-white/15 bg-white/5 p-3">
							<div class="text-sm font-medium">Custom lock image</div>
							<div class="flex gap-2">
								<input class="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" placeholder="https://..." bind:value={customLockUrl} />
								<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => applyCustom(customLockUrl, 'lock')}>Apply</button>
							</div>
							<input class="text-xs" type="file" accept="image/*" on:change={(e) => uploadLocalImage(e, 'lock')} />
						</div>
					</div>
				</div>
			{/if}
		</section>
	</div>
</div>
