import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export function saveBounds(id:string,bounds: Electron.Rectangle) {
    const boundsPath = path.join(app.getPath('userData'), `window-bounds-${id}.json`);
    fs.writeFileSync(boundsPath, JSON.stringify(bounds));
}

export function loadBounds(id:string): Electron.Rectangle | undefined {
    const boundsPath = path.join(app.getPath('userData'), `window-bounds-${id}.json`);

    try {
        return JSON.parse(fs.readFileSync(boundsPath, 'utf8'));
    } catch {
        return undefined;
    }
}
