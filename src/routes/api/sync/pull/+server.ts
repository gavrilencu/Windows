import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLatestSnapshot } from '$lib/server/sqlite';

export const GET: RequestHandler = async () => {
	const snapshot = getLatestSnapshot();
	if (!snapshot) {
		return json({ ok: true, hasSnapshot: false });
	}
	return json({
		ok: true,
		hasSnapshot: true,
		snapshotId: snapshot.id,
		createdAt: snapshot.createdAt,
		payload: snapshot.payload
	});
};
