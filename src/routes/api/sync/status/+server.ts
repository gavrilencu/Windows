import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLatestSnapshot, getSnapshotCount } from '$lib/server/sqlite';

export const GET: RequestHandler = async () => {
	const latest = getLatestSnapshot();
	const count = getSnapshotCount();
	return json({
		ok: true,
		hasSnapshot: Boolean(latest),
		lastSyncedAt: latest?.createdAt ?? null,
		snapshotCount: count
	});
};
