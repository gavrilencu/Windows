import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
	DesktopIcon,
	NoteDocument,
	NotificationItem,
	SystemPreferences,
	UserCredential,
	VirtualNode
} from '$lib/system/types';
import { DEFAULT_DESKTOP_ICONS, DEFAULT_PREFERENCES, ROOT_FOLDERS } from '$lib/system/constants';

interface WindowsWebOSDB extends DBSchema {
	credentials: {
		key: string;
		value: UserCredential;
	};
	preferences: {
		key: string;
		value: SystemPreferences;
	};
	icons: {
		key: string;
		value: DesktopIcon;
	};
	vfs: {
		key: string;
		value: VirtualNode;
	};
	notes: {
		key: string;
		value: NoteDocument;
	};
	notifications: {
		key: string;
		value: NotificationItem;
	};
}

let dbInstance: Promise<IDBPDatabase<WindowsWebOSDB>> | null = null;

async function seedDatabase(db: IDBPDatabase<WindowsWebOSDB>): Promise<void> {
	const pref = await db.get('preferences', 'main');
	if (!pref) {
		await db.put('preferences', DEFAULT_PREFERENCES, 'main');
	}

	const iconCount = await db.count('icons');
	if (!iconCount) {
		await Promise.all(DEFAULT_DESKTOP_ICONS.map((icon) => db.put('icons', icon, icon.id)));
	}

	const nodeCount = await db.count('vfs');
	if (!nodeCount) {
		await Promise.all(ROOT_FOLDERS.map((folder) => db.put('vfs', folder, folder.id)));
		await db.put('vfs', {
			id: 'file-readme',
			type: 'file',
			name: 'Welcome.txt',
			parentId: 'desktop',
			content:
				'Welcome to Windows 12 Web OS.\n\n- Open Start and launch apps.\n- Drag windows and use snap zones.\n- Settings and Notepad are autosaved in IndexedDB.',
			mimeType: 'text/plain',
			size: 182,
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}

	const note = await db.get('notes', 'notepad-main');
	if (!note) {
		await db.put('notes', { id: 'notepad-main', content: '', updatedAt: Date.now() }, 'notepad-main');
	}
}

export function getDB(): Promise<IDBPDatabase<WindowsWebOSDB>> {
	if (!dbInstance) {
		dbInstance = openDB<WindowsWebOSDB>('windows12-web-os', 1, {
			async upgrade(db) {
				const credentials = db.createObjectStore('credentials');
				const preferences = db.createObjectStore('preferences');
				const icons = db.createObjectStore('icons');
				db.createObjectStore('vfs');
				const notes = db.createObjectStore('notes');
				db.createObjectStore('notifications');
				void credentials;
				void preferences;
				void icons;
				void notes;
			}
		}).then(async (db) => {
			await seedDatabase(db);
			return db;
		});
	}
	return dbInstance;
}

export async function withDB<T>(fn: (db: IDBPDatabase<WindowsWebOSDB>) => Promise<T>): Promise<T> {
	const db = await getDB();
	return fn(db);
}
