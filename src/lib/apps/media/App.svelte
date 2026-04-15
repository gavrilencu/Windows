<svelte:options runes={false} />

<script lang="ts">
	let mediaUrl = '';
	let mediaType: 'audio' | 'video' = 'video';

	const loadFile = (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		mediaUrl = URL.createObjectURL(file);
		mediaType = file.type.startsWith('audio/') ? 'audio' : 'video';
	};
</script>

<div class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)]">
	<div class="border-b border-white/10 p-3">
		<input class="text-sm" type="file" accept="audio/*,video/*" on:change={loadFile} />
	</div>
	<div class="grid place-items-center p-3">
		{#if !mediaUrl}
			<div class="rounded-lg bg-white/5 p-3 text-sm text-[var(--muted)]">Choose an audio/video file</div>
		{:else if mediaType === 'audio'}
			<audio class="max-h-full max-w-full" controls src={mediaUrl}></audio>
		{:else}
			<video class="max-h-full max-w-full" controls src={mediaUrl}>
				<track kind="captions" />
			</video>
		{/if}
	</div>
</div>
