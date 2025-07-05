import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { getAppInfo } from './info';

export function saveBounds(id: string, bounds: Electron.Rectangle) {
    const { appDataPath } = getAppInfo();
    const boundsPath = path.join(appDataPath, 'bounds', `window-bounds-${id}.json`);
    fs.writeFileSync(boundsPath, JSON.stringify(bounds));
}

export function loadBounds(id: string): Electron.Rectangle | undefined {
    const { appDataPath } = getAppInfo();
    const boundsPath = path.join(appDataPath, 'bounds', `window-bounds-${id}.json`);
    try {
        return JSON.parse(fs.readFileSync(boundsPath, 'utf8'));
    } catch {
        return undefined;
    }
}
