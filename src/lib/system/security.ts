const encoder = new TextEncoder();

export async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
	const bytes = Array.from(new Uint8Array(digest));
	return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyHash(value: string, hash: string): Promise<boolean> {
	return (await sha256(value)) === hash;
}
