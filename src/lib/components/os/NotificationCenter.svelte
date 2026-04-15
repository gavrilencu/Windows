<svelte:options runes={false} />

<script lang="ts">
	import { markAllRead, notifications } from '$lib/stores/notifications';
	import { notificationCenterOpen } from '$lib/stores/windows';
</script>

{#if $notificationCenterOpen}
	<div class="notification-panel glass absolute bottom-[66px] right-3.5 z-40 max-h-[64vh] w-[min(360px,92vw)] overflow-auto rounded-2xl p-3">
		<div class="mb-2.5 flex items-center justify-between">
			<h3 class="text-sm font-semibold">Notifications</h3>
			<button class="rounded-lg bg-white/15 px-2 py-1 text-xs hover:bg-white/25" on:click={markAllRead}>Mark all read</button>
		</div>
		{#if !$notifications.length}
			<div class="rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">No notifications</div>
		{:else}
			{#each $notifications as item}
				<div class={`mb-2 rounded-xl bg-white/10 p-2.5 ${item.read ? 'opacity-70' : ''}`}>
					<strong>{item.title}</strong>
					<p class="my-1 text-sm text-[var(--muted)]">{item.message}</p>
					<small class="text-xs text-[var(--muted)]">{new Date(item.timestamp).toLocaleTimeString()}</small>
				</div>
			{/each}
		{/if}
	</div>
{/if}
