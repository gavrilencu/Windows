export type SystemPhase = 'boot' | 'lock' | 'desktop' | 'updating';

export type AppId = 'explorer' | 'settings' | 'notepad' | 'terminal' | 'browser' | 'media' | 'monitor';

export type ThemeMode = 'light' | 'dark';

export interface UserCredential {
	id: string;
	username: string;
	pinHash: string;
	passwordHash?: string;
	createdAt: number;
}

export interface SessionState {
	isAuthenticated: boolean;
	username: string;
}

export interface DesktopIcon {
	id: string;
	title: string;
	appId?: AppId;
	fileId?: string;
	x: number;
	y: number;
	selected?: boolean;
}

export interface AppDefinition {
	id: AppId;
	name: string;
	description: string;
	icon: string;
	componentPath: string;
	defaultWidth: number;
	defaultHeight: number;
	minWidth: number;
	minHeight: number;
}

export interface WindowFrame {
	id: string;
	appId: AppId;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	minimized: boolean;
	maximized: boolean;
	snapped?: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	focused: boolean;
	payload?: Record<string, unknown>;
	restoreBounds?: { x: number; y: number; width: number; height: number };
}

export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	timestamp: number;
	type: 'info' | 'success' | 'warning' | 'error';
	read: boolean;
}

export interface VirtualNodeBase {
	id: string;
	name: string;
	parentId: string | null;
	originalParentId?: string | null;
	deletedAt?: number | null;
	createdAt: number;
	updatedAt: number;
}

export interface VirtualFolder extends VirtualNodeBase {
	type: 'folder';
}

export interface VirtualFile extends VirtualNodeBase {
	type: 'file';
	mimeType: string;
	content: string;
	size: number;
}

export type VirtualNode = VirtualFolder | VirtualFile;

export interface SystemPreferences {
	theme: ThemeMode;
	wallpaper: string;
	lockscreenWallpaper: string;
	accentColor: string;
}

export interface NoteDocument {
	id: string;
	content: string;
	updatedAt: number;
}

export interface SyncBundle {
	preferences: SystemPreferences | null;
	credentials: UserCredential[];
	icons: DesktopIcon[];
	vfs: VirtualNode[];
	notes: NoteDocument[];
	notifications: NotificationItem[];
}

export interface RecentFileActivity {
	fileId: string;
	name: string;
	lastOpenedAt: number;
	originApp: AppId;
}
