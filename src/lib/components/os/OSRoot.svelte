<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import BootScreen from '$lib/components/os/BootScreen.svelte';
	import DesktopShell from '$lib/components/os/DesktopShell.svelte';
	import LockScreen from '$lib/components/os/LockScreen.svelte';
	import PowerScreen from '$lib/components/os/PowerScreen.svelte';
	import { loadDesktopIcons } from '$lib/stores/desktop';
	import { loadNotifications, pushNotification } from '$lib/stores/notifications';
	import { loadSessionState, systemPhase, theme } from '$lib/stores/session';
	import { refreshVfsNodes } from '$lib/stores/vfs';

	onMount(() => {
		const requestFullscreen = async () => {
			if (typeof document === 'undefined') return;
			if (document.fullscreenElement) return;
			try {
				await document.documentElement.requestFullscreen();
			} catch {
				// Browsers often block fullscreen without user gesture.
			}
		};

		// Best effort on load (works only in some environments/policies).
		void requestFullscreen();

		// Reliable path: first user interaction.
		const onceInteraction = () => {
			void requestFullscreen();
		};
		window.addEventListener('pointerdown', onceInteraction, { once: true });
		window.addEventListener('keydown', onceInteraction, { once: true });
		window.addEventListener('touchstart', onceInteraction, { once: true });

		const unsubscribe = theme.subscribe((value) => (document.body.dataset.theme = value));
		void (async () => {
			await Promise.all([loadSessionState(), loadDesktopIcons(), refreshVfsNodes(), loadNotifications()]);
			await pushNotification({
				title: 'System initialized',
				message: 'Windows 12 Web OS loaded from IndexedDB',
				type: 'info'
			});
		})();
		return () => {
			unsubscribe();
			window.removeEventListener('pointerdown', onceInteraction);
			window.removeEventListener('keydown', onceInteraction);
			window.removeEventListener('touchstart', onceInteraction);
		};
	});
</script>

{#if $systemPhase === 'boot'}
	<BootScreen />
{:else if $systemPhase === 'lock'}
	<LockScreen />
{:else if $systemPhase === 'updating'}
	<PowerScreen />
{:else}
	<DesktopShell />
{/if}
