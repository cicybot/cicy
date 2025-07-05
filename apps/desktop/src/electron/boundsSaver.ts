import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export function initBoundsPath() {
    console.log('initBoundsPath');
    fs.mkdirSync(path.join(app.getPath('userData'), 'bounds'), { recursive: true });
}
export function saveBounds(id: string, bounds: Electron.Rectangle) {
    const boundsPath = path.join(app.getPath('userData'), 'bounds', `window-bounds-${id}.json`);
    fs.writeFileSync(boundsPath, JSON.stringify(bounds));
}

export function loadBounds(id: string): Electron.Rectangle | undefined {
    const boundsPath = path.join(app.getPath('userData'), 'bounds', `window-bounds-${id}.json`);
    try {
        return JSON.parse(fs.readFileSync(boundsPath, 'utf8'));
    } catch {
        return undefined;
    }
}
