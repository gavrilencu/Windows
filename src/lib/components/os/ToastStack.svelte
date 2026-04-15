<svelte:options runes={false} />

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '$lib/stores/notifications';
</script>

<div class="absolute right-[18px] top-[14px] z-[10000] grid gap-2">
	{#each $toasts as toast (toast.id)}
		<div
			class={`min-w-[280px] max-w-[380px] rounded-xl border border-white/20 bg-[rgba(15,20,31,0.82)] p-3 ${
				toast.type === 'success'
					? 'border-l-4 border-l-emerald-400'
					: toast.type === 'warning'
						? 'border-l-4 border-l-amber-400'
						: toast.type === 'error'
							? 'border-l-4 border-l-rose-500'
							: ''
			}`}
			in:fly={{ x: 200, duration: 220 }}
			out:fly={{ x: 200, duration: 180 }}
		>
			<strong>{toast.title}</strong>
			<div>{toast.message}</div>
		</div>
	{/each}
</div>
