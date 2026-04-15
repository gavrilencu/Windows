import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface ClipboardEntry {
	id: string;
	text: string;
	timestamp: number;
}

export const clipboardHistory = writable<ClipboardEntry[]>([]);

if (browser) {
	const raw = localStorage.getItem('win12-clipboard-history');
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as ClipboardEntry[];
			if (Array.isArray(parsed)) clipboardHistory.set(parsed.slice(0, 30));
		} catch {
			// ignore malformed localStorage values
		}
	}

	clipboardHistory.subscribe((entries) => {
		localStorage.setItem('win12-clipboard-history', JSON.stringify(entries.slice(0, 30)));
	});
}

export function pushClipboardEntry(text: string): void {
	const value = text.trim();
	if (!value) return;
	clipboardHistory.update((list) => {
		const deduped = list.filter((item) => item.text !== value);
		return [{ id: `clip-${crypto.randomUUID()}`, text: value, timestamp: Date.now() }, ...deduped].slice(0, 30);
	});
}

export function removeClipboardEntry(id: string): void {
	clipboardHistory.update((list) => list.filter((entry) => entry.id !== id));
}

export function clearClipboardHistory(): void {
	clipboardHistory.set([]);
}
