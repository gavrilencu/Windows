<svelte:options runes={false} />

<script lang="ts">
	type Line = { type: 'input' | 'output'; text: string };
	let history: Line[] = [{ type: 'output', text: 'Windows Web Terminal [Version 12.0.1000]\nType "help" for commands.' }];
	let command = '';

	const commands: Record<string, string | (() => string)> = {
		help: 'Commands: help, dir, date, whoami, cls, echo <text>',
		dir: () => 'Desktop   Documents   Media   Welcome.txt',
		date: () => new Date().toString(),
		whoami: 'user@windows-web-os',
		cls: ''
	};

	const run = () => {
		const raw = command.trim();
		if (!raw) return;
		history = [...history, { type: 'input', text: `C:\\Users\\User> ${raw}` }];

		if (raw.startsWith('echo ')) {
			history = [...history, { type: 'output', text: raw.slice(5) }];
		} else if (raw === 'cls') {
			history = [];
		} else if (commands[raw]) {
			const response = typeof commands[raw] === 'function' ? (commands[raw] as () => string)() : commands[raw];
			history = [...history, { type: 'output', text: response }];
		} else {
			history = [...history, { type: 'output', text: `'${raw}' is not recognized as an internal command.` }];
		}

		command = '';
	};
</script>

<div class="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] bg-[#0a0d13] font-mono text-[#d4e5ff]">
	<div class="overflow-auto p-3 text-sm whitespace-pre-wrap">
		{#each history as line}
			<div class={line.type}>{line.text}</div>
		{/each}
	</div>
	<div class="flex items-center gap-2 border-t border-white/10 px-3 py-2">
		<span>C:\&gt;</span>
		<input class="flex-1 border-0 bg-transparent text-[#d4e5ff] outline-none" bind:value={command} on:keydown={(e) => e.key === 'Enter' && run()} />
	</div>
</div>
