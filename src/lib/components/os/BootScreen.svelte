<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { systemPhase } from '$lib/stores/session';

	let progress = 0;

	onMount(() => {
		const timer = setInterval(() => {
			progress = Math.min(100, progress + Math.floor(Math.random() * 14 + 4));
			if (progress >= 100) {
				clearInterval(timer);
				setTimeout(() => systemPhase.set('lock'), 650);
			}
		}, 240);
		return () => clearInterval(timer);
	});
</script>

<div class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_20%_20%,#163266,#06080f_58%)]">
	<div class="text-[clamp(1.8rem,2.8vw,2.4rem)] font-semibold tracking-[0.05em] text-white">Windows 12</div>
	<div class="mb-4 mt-4 flex gap-1.5">
		{#each Array(5) as _, i}
			<span
				class="h-2 w-2 animate-[spin_1s_ease-in-out_infinite] rounded-full bg-white opacity-40"
				style={`--i:${i};animation-delay:calc(var(--i)*120ms)`}
			></span>
		{/each}
	</div>
	<div class="h-1.5 w-[min(320px,66vw)] overflow-hidden rounded-full bg-white/20">
		<div class="h-full bg-gradient-to-r from-[#8bb4ff] to-[#d3e3ff] transition-[width] duration-200" style={`width:${progress}%`}></div>
	</div>
	<div class="mt-3 text-sm text-[#d8def9]">Loading core services...</div>
</div>
