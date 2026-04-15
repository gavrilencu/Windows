import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const volumeLevel = writable(68);
export const muted = writable(false);
export const wifiEnabled = writable(true);
export const connectedNetwork = writable('WindowsWebOS-5G');

if (browser) {
	const saved = localStorage.getItem('win12-system-state');
	if (saved) {
		try {
			const parsed = JSON.parse(saved) as {
				volumeLevel?: number;
				muted?: boolean;
				wifiEnabled?: boolean;
				connectedNetwork?: string;
			};
			if (typeof parsed.volumeLevel === 'number') volumeLevel.set(Math.max(0, Math.min(100, parsed.volumeLevel)));
			if (typeof parsed.muted === 'boolean') muted.set(parsed.muted);
			if (typeof parsed.wifiEnabled === 'boolean') wifiEnabled.set(parsed.wifiEnabled);
			if (typeof parsed.connectedNetwork === 'string') connectedNetwork.set(parsed.connectedNetwork);
		} catch {
			// ignore malformed localStorage payload
		}
	}

	let nextVolume = 68;
	let nextMuted = false;
	let nextWifi = true;
	let nextNetwork = 'WindowsWebOS-5G';

	const persist = () => {
		localStorage.setItem(
			'win12-system-state',
			JSON.stringify({
				volumeLevel: nextVolume,
				muted: nextMuted,
				wifiEnabled: nextWifi,
				connectedNetwork: nextNetwork
			})
		);
	};

	volumeLevel.subscribe((v) => {
		nextVolume = v;
		persist();
	});
	muted.subscribe((v) => {
		nextMuted = v;
		persist();
	});
	wifiEnabled.subscribe((v) => {
		nextWifi = v;
		persist();
	});
	connectedNetwork.subscribe((v) => {
		nextNetwork = v;
		persist();
	});
}
