import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SyncBundle } from '$lib/system/types';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'windows-web-os.sqlite');

if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new DatabaseSync(dbPath);

sqlite.exec(`PRAGMA journal_mode = WAL;`);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`);

const insertSnapshotStmt = sqlite.prepare(
	'INSERT INTO snapshots (payload, created_at) VALUES (@payload, @created_at)'
);
const latestSnapshotStmt = sqlite.prepare(
	'SELECT id, payload, created_at FROM snapshots ORDER BY id DESC LIMIT 1'
);
const countSnapshotsStmt = sqlite.prepare('SELECT COUNT(*) as count FROM snapshots');

export function saveSnapshot(payload: SyncBundle): number {
	const info = insertSnapshotStmt.run({
		payload: JSON.stringify(payload),
		created_at: Date.now()
	});
	return Number(info.lastInsertRowid);
}

export function getLatestSnapshot(): { id: number; payload: SyncBundle; createdAt: number } | null {
	const row = latestSnapshotStmt.get() as { id: number; payload: string; created_at: number } | undefined;
	if (!row) return null;
	return {
		id: row.id,
		payload: JSON.parse(row.payload) as SyncBundle,
		createdAt: row.created_at
	};
}

export function getSnapshotCount(): number {
	const row = countSnapshotsStmt.get() as { count: number };
	return row.count ?? 0;
}
