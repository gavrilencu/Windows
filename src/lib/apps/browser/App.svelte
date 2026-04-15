<svelte:options runes={false} />

<script lang="ts">
	export let payload: Record<string, unknown> = {};

	let url = 'https://example.com';
	let current = url;
	let history: string[] = [current];
	let historyIndex = 0;

	$: {
		const preset = payload.url;
		if (typeof preset === 'string' && preset.trim()) {
			url = preset.trim();
			current = url;
			history = [url];
			historyIndex = 0;
		}
	}

	const navigate = () => {
		const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
		current = normalized;
		history = [...history.slice(0, historyIndex + 1), normalized];
		historyIndex = history.length - 1;
	};

	const back = () => {
		if (historyIndex <= 0) return;
		historyIndex -= 1;
		current = history[historyIndex];
		url = current;
	};

	const forward = () => {
		if (historyIndex >= history.length - 1) return;
		historyIndex += 1;
		current = history[historyIndex];
		url = current;
	};

	const refresh = () => {
		current = `${history[historyIndex]}#${Date.now()}`;
	};
</script>

<div class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)]">
	<div class="flex gap-2 border-b border-white/10 p-2">
		<button class="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25" on:click={back}>◀</button>
		<button class="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25" on:click={forward}>▶</button>
		<button class="rounded-lg bg-white/15 px-2 py-1 text-sm hover:bg-white/25" on:click={refresh}>↻</button>
		<input
			class="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[var(--text)] outline-none"
			bind:value={url}
			on:keydown={(e) => e.key === 'Enter' && navigate()}
		/>
		<button class="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-white" on:click={navigate}>Go</button>
	</div>
	<iframe class="h-full w-full border-0 bg-white" title="Sandbox browser" src={current} sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
</div>
