<svelte:options runes={false} />

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { WindowFrame } from '$lib/system/types';

	export let windowFrame: WindowFrame;
	export let appName = '';

	let canvas: HTMLCanvasElement;
	let ticker: ReturnType<typeof setInterval> | null = null;
	let tick = 0;

	const appColor = (appId: string): string => {
		if (appId === 'explorer') return '#3b82f6';
		if (appId === 'settings') return '#64748b';
		if (appId === 'notepad') return '#10b981';
		if (appId === 'terminal') return '#22c55e';
		if (appId === 'browser') return '#0ea5e9';
		if (appId === 'media') return '#eab308';
		if (appId === 'monitor') return '#f97316';
		return '#a78bfa';
	};

	const draw = () => {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		const color = appColor(windowFrame.appId);

		ctx.clearRect(0, 0, w, h);
		const gradient = ctx.createLinearGradient(0, 0, w, h);
		gradient.addColorStop(0, '#111827');
		gradient.addColorStop(1, '#1f2937');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);

		ctx.fillStyle = 'rgba(255,255,255,0.08)';
		ctx.fillRect(0, 0, w, 24);
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 11px Segoe UI';
		ctx.fillText(windowFrame.title.slice(0, 28), 8, 16);

		ctx.fillStyle = color;
		ctx.fillRect(8, 32, w - 16, h - 40);
		ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
		ctx.fillRect(14, 38, w - 28, h - 52);

		ctx.fillStyle = '#e2e8f0';
		ctx.font = '10px Segoe UI';
		ctx.fillText(appName, 18, 52);
		ctx.fillText(`PID ${windowFrame.id.slice(0, 8)}`, 18, 66);
		ctx.fillText(`${windowFrame.width}x${windowFrame.height}`, 18, 80);
		ctx.fillText(windowFrame.minimized ? 'Minimized' : windowFrame.focused ? 'Focused' : 'Background', 18, 94);
		ctx.fillText(new Date().toLocaleTimeString(), w - 70, h - 8);

		// tiny pulse to look live
		ctx.fillStyle = 'rgba(255,255,255,0.22)';
		const pulse = 4 + ((tick % 5) + 1) * 4;
		ctx.fillRect(w - 12, h - 12, pulse, 3);
	};

	$: draw();

	onMount(() => {
		draw();
		ticker = setInterval(() => {
			tick += 1;
			draw();
		}, 1000);
	});

	onDestroy(() => {
		if (ticker) clearInterval(ticker);
	});
</script>

<canvas bind:this={canvas} width="220" height="124" class="h-[124px] w-[220px] rounded-lg border border-white/10"></canvas>
