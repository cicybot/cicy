import { promises as fs } from 'fs';
import path from 'path';

class FileHelper {
    /**
     * Check if a file or directory exists
     * @param filePath Path to check
     * @returns Boolean indicating existence
     */
    static async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Read file contents
     * @param filePath Path to file
     * @returns File contents as string
     */
    static async readString(filePath: string): Promise<boolean | string> {
        try {
            const res = await fs.readFile(filePath, 'utf-8');
            return res;
        } catch {
            return false;
        }
    }

    /**
     * Write data to a file
     * @param filePath Path to file
     * @param data Data to write
     * @returns Promise that resolves when write is complete
     */
    static async writeString(filePath: string, data: string): Promise<boolean> {
        try {
            const dir = path.dirname(filePath);
            if (!(await this.exists(dir))) {
                await this.mkdir(dir);
            }
            await fs.writeFile(filePath, data, 'utf-8');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create a directory (and parent directories if needed)
     * @param dirPath Path to directory
     * @returns Promise that resolves when directory is created
     */
    static async mkdir(dirPath: string): Promise<boolean> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch {
            return false;
        }
    }
}

export default FileHelper;
