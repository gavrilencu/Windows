<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import DesktopArea from '$lib/components/os/DesktopArea.svelte';
	import NotificationCenter from '$lib/components/os/NotificationCenter.svelte';
	import QuickPanel from '$lib/components/os/QuickPanel.svelte';
	import StartMenu from '$lib/components/os/StartMenu.svelte';
	import SystemFlyouts from '$lib/components/os/SystemFlyouts.svelte';
	import Taskbar from '$lib/components/os/Taskbar.svelte';
	import ToastStack from '$lib/components/os/ToastStack.svelte';
	import WindowHost from '$lib/components/os/WindowHost.svelte';
	import { pushClipboardEntry } from '$lib/stores/clipboard';
	import { wallpaper } from '$lib/stores/session';
	import {
		closeFocusedWindow,
		closeOverlays,
		focusNextWindow,
		getFocusedWindowId,
		maximizeFocusedWindow,
		minimizeFocusedWindow,
		snapWindowLayout,
		toggleClipboardFlyout,
		toggleStartMenu
	} from '$lib/stores/windows';

	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Meta') {
				toggleStartMenu();
			}
			if (e.altKey && e.key.toLowerCase() === 'tab') {
				e.preventDefault();
				focusNextWindow();
			}
			if (e.altKey && e.key === 'F4') {
				e.preventDefault();
				closeFocusedWindow();
			}
			if (e.metaKey && e.key.toLowerCase() === 'v') {
				e.preventDefault();
				toggleClipboardFlyout();
			}
			if (e.metaKey && e.key === 'ArrowLeft') {
				e.preventDefault();
				const id = getFocusedWindowId();
				if (id) snapWindowLayout(id, 'left');
			}
			if (e.metaKey && e.key === 'ArrowRight') {
				e.preventDefault();
				const id = getFocusedWindowId();
				if (id) snapWindowLayout(id, 'right');
			}
			if (e.metaKey && e.key === 'ArrowUp') {
				e.preventDefault();
				maximizeFocusedWindow();
			}
			if (e.metaKey && e.key === 'ArrowDown') {
				e.preventDefault();
				minimizeFocusedWindow();
			}
			if (e.key === 'Escape') {
				closeOverlays();
			}
		};

		const copyHandler = () => {
			const selected = window.getSelection()?.toString() ?? '';
			if (selected.trim()) pushClipboardEntry(selected);
		};

		window.addEventListener('keydown', handler);
		window.addEventListener('copy', copyHandler);
		window.addEventListener('cut', copyHandler);
		return () => {
			window.removeEventListener('keydown', handler);
			window.removeEventListener('copy', copyHandler);
			window.removeEventListener('cut', copyHandler);
		};
	});

	const handleBackdropClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const inside =
			target.closest('.start-menu-panel') ||
			target.closest('.notification-panel') ||
			target.closest('.quick-panel') ||
			target.closest('.calendar-flyout') ||
			target.closest('.volume-flyout') ||
			target.closest('.network-flyout') ||
			target.closest('.clipboard-flyout') ||
			target.closest('.taskbar-root');
		if (!inside) {
			closeOverlays();
		}
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative h-full w-full bg-cover bg-center" style={`background-image:url(${$wallpaper})`} on:mousedown={handleBackdropClick}>
	<DesktopArea />
	<WindowHost />
	<StartMenu />
	<NotificationCenter />
	<QuickPanel />
	<SystemFlyouts />
	<ToastStack />
	<Taskbar />
</div>
