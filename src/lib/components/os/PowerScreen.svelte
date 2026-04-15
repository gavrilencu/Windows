<svelte:options runes={false} />

<script lang="ts">
	import { LoaderCircle, Power } from 'lucide-svelte';
	import { powerMode, powerOnSystem } from '$lib/stores/session';
</script>

<div class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_20%_20%,#10131f,#04050a_60%)] text-white">
	<div class="w-[min(520px,88vw)] text-center">
		{#if $powerMode === 'shutdown'}
			<div class="mb-3 flex justify-center">
				<div class="grid h-14 w-14 place-items-center rounded-full bg-white/10">
					<Power size={24} />
				</div>
			</div>
			<h2 class="text-2xl font-semibold">Shutting down</h2>
			<p class="mt-2 text-sm text-white/75">Windows Web OS is now powered off.</p>
			<button class="mt-6 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm text-white hover:brightness-110" on:click={powerOnSystem}>
				Power on
			</button>
		{:else}
			<div class="mb-3 flex justify-center">
				<LoaderCircle size={28} class="animate-spin text-white/90" />
			</div>
			<h2 class="text-2xl font-semibold">Restarting</h2>
			<p class="mt-2 text-sm text-white/75">Please wait while the system restarts...</p>
		{/if}
	</div>
</div>
