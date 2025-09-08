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

    static async readString(filePath: string, length?: number): Promise<string> {
        try {
            // Check if file exists first
            try {
                await fs.access(filePath);
            } catch {
                return '';
            }

            if (length !== undefined && length > 0) {
                // Read only specified number of bytes
                const fileHandle = await fs.open(filePath, 'r');
                try {
                    const buffer = Buffer.alloc(length);
                    const { bytesRead } = await fileHandle.read(buffer, 0, length, 0);
                    return buffer.subarray(0, bytesRead).toString('base64');
                } finally {
                    await fileHandle.close();
                }
            } else {
                // Read entire file
                const buffer = await fs.readFile(filePath);
                return buffer.toString('base64');
            }
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return '';
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

    /**
     * Copy a file or directory recursively
     * @param fromPath Source path
     * @param toPath Destination path
     * @returns Boolean indicating success
     */
    static async cp(fromPath: string, toPath: string): Promise<boolean> {
        try {
            // Check if source exists
            if (!(await this.exists(fromPath))) {
                return false;
            }

            const stats = await fs.stat(fromPath);

            if (stats.isDirectory()) {
                // Copy directory recursively
                await this.mkdir(toPath);

                const items = await fs.readdir(fromPath);
                for (const item of items) {
                    const fromItem = path.join(fromPath, item);
                    const toItem = path.join(toPath, item);
                    await this.cp(fromItem, toItem); // Recursive call
                }
                return true;
            } else {
                // Copy file
                const toDir = path.dirname(toPath);
                if (!(await this.exists(toDir))) {
                    await this.mkdir(toDir);
                }
                await fs.copyFile(fromPath, toPath);
                return true;
            }
        } catch (error) {
            console.error(`Error copying from ${fromPath} to ${toPath}:`, error);
            return false;
        }
    }

    /**
     * Move/rename a file or directory
     * @param fromPath Source path
     * @param toPath Destination path
     * @returns Boolean indicating success
     */
    static async mv(fromPath: string, toPath: string): Promise<boolean> {
        try {
            // Check if source exists
            if (!(await this.exists(fromPath))) {
                return false;
            }

            const toDir = path.dirname(toPath);
            if (!(await this.exists(toDir))) {
                await this.mkdir(toDir);
            }

            await fs.rename(fromPath, toPath);
            return true;
        } catch (error) {
            console.error(`Error moving from ${fromPath} to ${toPath}:`, error);
            return false;
        }
    }
}

export default FileHelper;
