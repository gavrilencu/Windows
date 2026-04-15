<svelte:options runes={false} />

<script lang="ts">
	import { pushNotification } from '$lib/stores/notifications';
	import { theme, updatePreferences } from '$lib/stores/session';
	import { quickPanelOpen } from '$lib/stores/windows';
	import { launchApp } from '$lib/stores/windows';
	import { randomWallpaper } from '$lib/system/wallpapers';

	const toggleTheme = async () => {
		await updatePreferences({ theme: $theme === 'dark' ? 'light' : 'dark' });
	};

	const randomizeWallpaper = async () => {
		const desktop = randomWallpaper().url;
		const lock = randomWallpaper().url;
		await updatePreferences({ wallpaper: desktop, lockscreenWallpaper: lock });
		await pushNotification({
			title: 'Quick panel',
			message: 'Desktop and lockscreen wallpapers changed.',
			type: 'success'
		});
	};

	const quickLaunch = (app: 'settings' | 'explorer' | 'notepad' | 'terminal') => launchApp(app);
</script>

{#if $quickPanelOpen}
	<div class="quick-panel glass absolute right-4 top-14 z-40 w-[320px] rounded-2xl p-3">
		<div class="mb-2 text-sm font-semibold">Quick Panel</div>
		<div class="grid grid-cols-2 gap-2">
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={toggleTheme}>
				Toggle Theme
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={randomizeWallpaper}>
				Random Backgrounds
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => quickLaunch('settings')}>
				Open Settings
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => quickLaunch('explorer')}>
				Open Explorer
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => quickLaunch('notepad')}>
				Open Notepad
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25" on:click={() => quickLaunch('terminal')}>
				Open Terminal
			</button>
		</div>
	</div>
{/if}
