import { spawn, exec } from 'child_process';
import os from 'os';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export function openTerminal(command: string, showWin?: boolean): number | undefined {
    if (!showWin) {
        if (process.platform === 'win32') {
            const p = spawn('cmd.exe', ['/c', 'start', '/B', command], {
                windowsHide: true,
                detached: false,
                stdio: 'ignore',
                shell: false,
                windowsVerbatimArguments: true // 避免参数转义问题
            });
            return p.pid;
        } else {
            const p = spawn(command, [], {
                windowsHide: true,
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            return p.pid;
        }
    }
    const width = 1024;
    const height = 320;
    let p;

    if (process.platform === 'win32') {
        const sizedCmd = `mode con: cols=${Math.floor(width / 8)} lines=${Math.floor(
            height / 16
        )} && ${command}`;
        p = spawn('cmd.exe', ['/k', sizedCmd], { detached: true });
    } else if (process.platform === 'darwin') {
        const script = `
    tell application "Terminal"
        do script "${command.replace(/"/g, '\\"')}"
        set bounds of front window to {0, 0, ${width}, ${height}}
    end tell
    `;
        p = spawn('osascript', ['-e', script], { detached: true });
    } else {
        // Linux - try different terminals
        try {
            p = spawn(
                'gnome-terminal',
                [`--geometry=${width}x${height}`, '--', 'bash', '-c', command],
                { detached: true }
            );
        } catch {
            p = spawn(
                'xterm',
                ['-geometry', `${Math.floor(width / 8)}x${Math.floor(height / 16)}`, '-e', command],
                { detached: true }
            );
        }
    }

    return p.pid;
}

export function killProcessByName(name: string) {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let command;

        if (platform === 'darwin') {
            // macOS
            command = `pkill -f ${name}`;
        } else if (platform === 'win32') {
            // Windows
            command = `taskkill /F /IM ${name}.exe`;
        } else {
            return reject(new Error('Unsupported platform'));
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // 如果进程不存在，pkill/taskkill 会返回错误，但我们可能认为这是成功的
                if (error.code === 1 && platform === 'darwin') {
                    // pkill 没找到进程返回 1
                    return resolve('No /meta process found on macOS');
                } else if (error.code === 128 && platform === 'darwin') {
                    // pkill 的其他错误
                    return reject(new Error(`Failed to kill meta on macOS: ${stderr}`));
                } else if (error.code === 128 && platform === 'win32') {
                    // taskkill 没找到进程
                    return resolve('No meta.exe process found on Windows');
                }
                return reject(new Error(`Failed to kill process: ${stderr}`));
            }
            resolve(stdout || `Successfully killed process on ${platform}`);
        });
    });
}
