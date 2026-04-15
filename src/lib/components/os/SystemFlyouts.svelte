<svelte:options runes={false} />

<script lang="ts">
	import { pushNotification } from '$lib/stores/notifications';
	import { clearClipboardHistory, clipboardHistory, pushClipboardEntry, removeClipboardEntry } from '$lib/stores/clipboard';
	import { connectedNetwork, muted, volumeLevel, wifiEnabled } from '$lib/stores/systemState';
	import {
		calendarFlyoutOpen,
		clipboardFlyoutOpen,
		networkFlyoutOpen,
		toggleCalendarFlyout,
		toggleClipboardFlyout,
		toggleNetworkFlyout,
		toggleVolumeFlyout,
		volumeFlyoutOpen
	} from '$lib/stores/windows';

	let now = new Date();
	$: monthName = now.toLocaleString([], { month: 'long', year: 'numeric' });
	$: days = buildCalendarGrid(now);

	function buildCalendarGrid(date: Date): Array<number | null> {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const leading = Array.from({ length: firstDay }, () => null);
		const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
		const trailing = Array.from({ length: Math.max(0, 42 - leading.length - monthDays.length) }, () => null);
		return [...leading, ...monthDays, ...trailing];
	}

	const copyHistoryItem = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			pushClipboardEntry(text);
			await pushNotification({ title: 'Clipboard', message: 'Text copied from history.', type: 'success' });
			toggleClipboardFlyout();
		} catch {
			await pushNotification({ title: 'Clipboard', message: 'Clipboard permission denied by browser.', type: 'warning' });
		}
	};

	const setVolume = (value: number) => {
		const next = Math.max(0, Math.min(100, value));
		volumeLevel.set(next);
		if (next > 0 && $muted) muted.set(false);
	};

	const pickNetwork = async (name: string) => {
		if (!$wifiEnabled) {
			await pushNotification({ title: 'Network', message: 'Enable Wi-Fi first.', type: 'warning' });
			return;
		}
		connectedNetwork.set(name);
		await pushNotification({ title: 'Network', message: `Connected to ${name}.`, type: 'success' });
		toggleNetworkFlyout();
	};
</script>

{#if $calendarFlyoutOpen}
	<div class="calendar-flyout glass absolute bottom-[66px] right-3 z-40 w-[320px] rounded-2xl p-3">
		<div class="mb-2 flex items-center justify-between">
			<div class="text-sm font-semibold">{monthName}</div>
			<button class="rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20" on:click={toggleCalendarFlyout}>Close</button>
		</div>
		<div class="mb-1 grid grid-cols-7 text-center text-[10px] text-[var(--muted)]">
			<span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
		</div>
		<div class="grid grid-cols-7 gap-1 text-center text-xs">
			{#each days as day}
				<div class={`rounded-md py-1 ${day === now.getDate() ? 'bg-[var(--accent)] text-white' : day ? 'bg-white/10' : 'opacity-30'}`}>
					{day ?? ''}
				</div>
			{/each}
		</div>
		<div class="mt-2 text-xs text-[var(--muted)]">{now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
	</div>
{/if}

{#if $volumeFlyoutOpen}
	<div class="volume-flyout glass absolute bottom-[66px] right-3 z-40 w-[280px] rounded-2xl p-3">
		<div class="mb-2 flex items-center justify-between">
			<div class="text-sm font-semibold">Volume</div>
			<button class="rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20" on:click={toggleVolumeFlyout}>Close</button>
		</div>
		<div class="mb-2 flex items-center justify-between text-xs">
			<span>{$muted ? 'Muted' : 'Speaker'}</span>
			<span>{$volumeLevel}%</span>
		</div>
		<input class="w-full" type="range" min="0" max="100" value={$volumeLevel} on:input={(e) => setVolume(Number((e.target as HTMLInputElement).value))} />
		<div class="mt-2 flex gap-2">
			<button class="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/25" on:click={() => muted.set(!$muted)}>
				{$muted ? 'Unmute' : 'Mute'}
			</button>
			<button class="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/25" on:click={() => setVolume(100)}>Max</button>
		</div>
	</div>
{/if}

{#if $networkFlyoutOpen}
	<div class="network-flyout glass absolute bottom-[66px] right-3 z-40 w-[300px] rounded-2xl p-3">
		<div class="mb-2 flex items-center justify-between">
			<div class="text-sm font-semibold">Network</div>
			<button class="rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20" on:click={toggleNetworkFlyout}>Close</button>
		</div>
		<div class="mb-2 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs">
			<span>Wi-Fi</span>
			<button class="rounded-md bg-white/15 px-2 py-1 hover:bg-white/25" on:click={() => wifiEnabled.set(!$wifiEnabled)}>
				{$wifiEnabled ? 'On' : 'Off'}
			</button>
		</div>
		<div class="mb-2 text-xs text-[var(--muted)]">Connected: {$wifiEnabled ? $connectedNetwork : 'offline'}</div>
		<div class="grid gap-1">
			{#each ['WindowsWebOS-5G', 'WindowsLab', 'Guest-Network'] as network}
				<button class="rounded-lg bg-white/10 px-3 py-2 text-left text-xs hover:bg-white/20" on:click={() => pickNetwork(network)}>
					{network}
				</button>
			{/each}
		</div>
	</div>
{/if}

{#if $clipboardFlyoutOpen}
	<div class="clipboard-flyout glass absolute bottom-[66px] right-3 z-40 max-h-[56vh] w-[360px] overflow-auto rounded-2xl p-3">
		<div class="mb-2 flex items-center justify-between">
			<div class="text-sm font-semibold">Clipboard history</div>
			<button class="rounded-md bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20" on:click={toggleClipboardFlyout}>Close</button>
		</div>
		<div class="mb-2 flex gap-2">
			<button class="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/25" on:click={clearClipboardHistory}>Clear all</button>
		</div>
		{#if !$clipboardHistory.length}
			<div class="rounded-lg bg-white/5 p-3 text-xs text-[var(--muted)]">Copy text in any app, then press Win+V.</div>
		{:else}
			<div class="grid gap-1">
				{#each $clipboardHistory as entry}
					<div class="rounded-lg bg-white/10 p-2">
						<button class="mb-1 w-full rounded-md bg-white/10 px-2 py-1 text-left text-xs hover:bg-white/20" on:click={() => copyHistoryItem(entry.text)}>
							{entry.text.length > 110 ? `${entry.text.slice(0, 110)}...` : entry.text}
						</button>
						<div class="flex items-center justify-between text-[10px] text-[var(--muted)]">
							<span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
							<button class="rounded bg-red-500/30 px-1.5 py-0.5 hover:bg-red-500/50" on:click={() => removeClipboardEntry(entry.id)}>Remove</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
