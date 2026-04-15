<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { lockscreenWallpaper, systemPhase, unlockWithCredential } from '$lib/stores/session';
	import { pushNotification } from '$lib/stores/notifications';

	let clock = new Date();
	let showAuth = false;
	let secret = '';
	let badTry = false;
	let loadingBio = false;

	const openAuth = () => (showAuth = true);

	const handleUnlock = async () => {
		badTry = false;
		const ok = await unlockWithCredential(secret);
		if (!ok) {
			badTry = true;
			secret = '';
			await pushNotification({
				title: 'Authentication failed',
				message: 'Invalid PIN/password. Try 1234 on first boot.',
				type: 'warning'
			});
		}
	};

	const fakeBiometric = async () => {
		loadingBio = true;
		setTimeout(async () => {
			loadingBio = false;
			systemPhase.set('desktop');
			await pushNotification({
				title: 'Windows Hello',
				message: 'Biometric verification successful (simulated).',
				type: 'success'
			});
		}, 1600);
	};

	onMount(() => {
		const timer = setInterval(() => (clock = new Date()), 1000);
		const keyHandler = () => openAuth();
		window.addEventListener('keydown', keyHandler);
		return () => {
			clearInterval(timer);
			window.removeEventListener('keydown', keyHandler);
		};
	});
</script>

<div
	class="relative grid h-full w-full place-items-center bg-cover bg-center"
	style={`background-image:url(${$lockscreenWallpaper})`}
	role="button"
	tabindex="0"
	on:click={openAuth}
	on:touchstart={openAuth}
	on:keydown={openAuth}
>
	<div class="absolute inset-0 bg-gradient-to-b from-black/20 to-black/55"></div>
	{#if !showAuth}
		<div class="z-10 text-center text-white">
			<div class="text-[clamp(3.2rem,8vw,6rem)] font-medium">
				{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
			</div>
			<div class="mb-6 text-xl">{clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
			<div class="text-sm text-[#e6ecff]">Click, drag or press any key to unlock</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="z-10 w-[min(420px,90vw)] rounded-[18px] border border-white/25 bg-[rgba(17,21,34,0.62)] p-6 text-center text-white backdrop-blur-xl"
			on:pointerdown|stopPropagation
		>
			<h2 class="text-2xl font-medium">User</h2>
			<p class="mt-1 text-sm text-white/80">Enter PIN or password</p>
			<input
				class="mt-3 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/60"
				bind:value={secret}
				type="password"
				placeholder="PIN / Password"
				on:keydown={(e) => e.key === 'Enter' && handleUnlock()}
			/>
			<button class="mt-2 w-full rounded-xl bg-[var(--accent)] px-3 py-2 text-white" on:click={handleUnlock}>Unlock</button>
			<button class="mt-2 w-full rounded-xl bg-white/15 px-3 py-2 text-white" on:click={fakeBiometric} disabled={loadingBio}>
				{loadingBio ? 'Scanning...' : 'Use Windows Hello (simulated)'}
			</button>
			{#if badTry}<div class="mt-2 text-sm text-red-200">Wrong credentials. Default PIN: 1234</div>{/if}
		</div>
	{/if}
</div>
