import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execPromise = util.promisify(exec)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getLocalIPAddress() {
    const networkInterfaces = os.networkInterfaces();
    // Loop through all network interfaces to find the Ethernet (or active network)
    for (const interfaceName of Object.keys(networkInterfaces)) {
        const addresses = networkInterfaces[interfaceName];
        if (addresses) {
            for (const addressInfo of addresses) {
                // Filter out internal addresses (loopback) and look for IPv4
                if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                    return { adr: addressInfo.address, interfaceName: interfaceName };
                }
            }
        }
    }

    return null;
}
export async function isPortOnline(port: number): Promise<boolean> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      const { stdout } = await execPromise(
        `netstat -ano | findstr :${port} | findstr LISTENING`
      );
      return stdout.trim() !== '';
    } else {
      // Try both methods for Unix-like systems
      try {
        const { stdout } = await execPromise(
          `lsof -i tcp:${port} -s TCP:LISTEN -t`
        );
        return stdout.trim() !== '';
      } catch {
        // Fallback to awk method
        const { stdout } = await execPromise(
          `lsof -i :${port} | awk '$1!="COMMAND" && $NF~"LISTEN" {print $2}'`
        );
        return stdout.trim() !== '';
      }
    }
  } catch (error) {
    // If the command fails (no processes found), the port is offline
    return false;
  }
}

export async function killPort(port: number, timeout: number = 50000): Promise<void> {
  const platform = process.platform;
  const startTime = Date.now();

  if (platform === 'win32') {
    // Windows implementation
    try {
      // Find PIDs listening on the port
      const { stdout } = await execPromise(
        `netstat -ano | findstr :${port} | findstr LISTENING`
      );
      
      const pids = new Set<string>();
      stdout.trim().split('\n').forEach(line => {
        const match = line.trim().split(/\s+/).pop();
        if (match) pids.add(match);
      });

      // Kill all found PIDs
      for (const pid of pids) {
        await execPromise(`taskkill /PID ${pid} /F`);
      }

      // Wait for port to be released
      while (await isPortOnline(port) ){
        if (Date.now() - startTime > timeout) {
          throw new Error(`Timeout waiting for port ${port} to be released`);
        }
        await sleep(100);
      }
    } catch (error) {
      if (!errorToString(error).includes('findstr')) {
        throw error;
      }
      // Ignore "no processes found" errors
    }
  } else {
    // macOS/Linux implementation
    try {
      // Method 1: Use lsof with LISTEN filter
      const { stdout } = await execPromise(
        `lsof -i tcp:${port} -s TCP:LISTEN -t`
      );
      
      const pids = stdout.trim().split('\n').filter(pid => pid.trim() !== '');
      
      for (const pid of pids) {
        await execPromise(`kill -9 ${pid}`);
      }

      // Wait for port to be released
      while (await isPortOnline(port)) {
        if (Date.now() - startTime > timeout) {
          throw new Error(`Timeout waiting for port ${port} to be released`);
        }
        await sleep(100);
      }
    } catch (error) {
      // Fallback if lsof fails or no results
      try {
        const { stdout } = await execPromise(
          `lsof -i :${port} | awk '$1!="COMMAND" && $NF~"LISTEN" {print $2}'`
        );
        
        const pids = stdout.trim().split('\n').filter(pid => pid.trim() !== '');
        for (const pid of pids) {
          await execPromise(`kill -9 ${pid}`);
        }

        // Wait for port to be released
        while (await isPortOnline(port)) {
          if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout waiting for port ${port} to be released`);
          }
          await sleep(100);
        }
      } catch {
        // Ignore errors if no processes found
      }
    }
  }
}

// Helper to safely convert errors to string
function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}