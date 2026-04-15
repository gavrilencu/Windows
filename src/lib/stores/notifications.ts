import { writable } from 'svelte/store';
import type { NotificationItem } from '$lib/system/types';
import { withDB } from '$lib/system/db';

export const notifications = writable<NotificationItem[]>([]);
export const toasts = writable<NotificationItem[]>([]);

export async function loadNotifications(): Promise<void> {
	const items = await withDB((db) => db.getAll('notifications'));
	notifications.set(items.sort((a, b) => b.timestamp - a.timestamp));
}

export async function pushNotification(input: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): Promise<void> {
	const item: NotificationItem = {
		...input,
		id: `notif-${crypto.randomUUID()}`,
		timestamp: Date.now(),
		read: false
	};
	await withDB((db) => db.put('notifications', item, item.id));
	notifications.update((list) => [item, ...list]);
	toasts.update((list) => [item, ...list.slice(0, 4)]);
	setTimeout(() => {
		toasts.update((list) => list.filter((t) => t.id !== item.id));
	}, 3800);
}

export async function markAllRead(): Promise<void> {
	const items = await withDB((db) => db.getAll('notifications'));
	for (const item of items) {
		item.read = true;
		await withDB((db) => db.put('notifications', item, item.id));
	}
	notifications.set(items.sort((a, b) => b.timestamp - a.timestamp));
}
