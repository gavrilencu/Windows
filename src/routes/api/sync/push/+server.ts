import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveSnapshot } from '$lib/server/sqlite';
import type { SyncBundle } from '$lib/system/types';

function isValidBundle(payload: unknown): payload is SyncBundle {
	if (!payload || typeof payload !== 'object') return false;
	const bundle = payload as Record<string, unknown>;
	return (
		'preferences' in bundle &&
		'credentials' in bundle &&
		'icons' in bundle &&
		'vfs' in bundle &&
		'notes' in bundle &&
		'notifications' in bundle
	);
}

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	if (!isValidBundle(data)) {
		return json({ ok: false, error: 'Invalid payload' }, { status: 400 });
	}
	const id = saveSnapshot(data);
	return json({ ok: true, snapshotId: id });
};
