export function generateRandomPassword(isDev: boolean, length: number = 6): string {
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    if (isDev) {
        chars = '88';
        length = 2;
    }
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }
    return password;
}

export function formatNumber(num: number): string {
    return num.toLocaleString('en', { useGrouping: true }).replace(/,/g, ' ');
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateDeviceId(IS_DEV: boolean): string {
    let groups = [1, 3, 3, 3, 3];
    if (IS_DEV) {
        groups = [1, 3];
    }
    let deviceId = '';

    groups.forEach((groupLength, index) => {
        for (let i = 0; i < groupLength; i++) {
            let randomDigit = Math.floor(Math.random() * 10); // Generate a random digit (0-9)
            if (groupLength === 1 && randomDigit === 0) {
                randomDigit = 1;
            }
            deviceId += randomDigit;
        }
    });

    return deviceId;
}

const arrayBufferToBase64 = (buffer: Iterable<number> | ArrayBuffer) => {
    let binary = '';
    // @ts-ignore
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export function stringToHex(str: string): string {
    return str
        .split('')
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

export function padKeyTo8Bytes(key: string): string {
    return key.length >= 8
        ? key.substring(0, 8) // Truncate if the key is longer than 8 characters
        : key.padEnd(8, '0'); // Pad with '0' if the key is shorter than 8 characters
}

export function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const elapsed = now - timestamp;
    const ms = (elapsed / 1000).toFixed(2);
    return `${ms} s`;
}
export function deepDiff(obj1: any, obj2: any): boolean {
    let hasDifference = false;

    function findChanges(o1: any, o2: any): void {
        Object.keys(o1).forEach(key => {
            if (
                typeof o1[key] === 'object' &&
                typeof o2[key] === 'object' &&
                o1[key] !== null &&
                o2[key] !== null
            ) {
                findChanges(o1[key], o2[key]);
            } else if (o1[key] !== o2[key]) {
                hasDifference = true;
            }
        });

        Object.keys(o2).forEach(key => {
            if (!(key in o1)) {
                hasDifference = true;
            }
        });
    }

    findChanges(obj1, obj2);
    return hasDifference;
}

export const isString = (data: any) => {
    return typeof data === 'string';
};

export const stringIsJson = (data: any) => {
    if (!data || typeof data !== 'string') {
        return false;
    }
    return (
        (data.startsWith('{') && data.endsWith('}')) || (data.startsWith('[') && data.endsWith(']'))
    );
};

export function waitForResult(
    cb: () => any | Promise<any>,
    timeout: number = -1,
    interval: number = 100
): Promise<any | null> {
    const startTime = Date.now();

    return new Promise(resolve => {
        const checkReply = async () => {
            try {
                const res = await Promise.resolve(cb()); // Ensure cb result is a Promise
                if (res) {
                    resolve(res);
                    return;
                }

                // Check for timeout
                if (timeout > -1 && Date.now() - startTime > timeout) {
                    resolve({ err: 'ERR_TIMEOUT' });
                    return;
                }

                // Retry after interval
                setTimeout(checkReply, interval);
            } catch (error) {
                console.error('Error in waitForResult callback:', error);
                resolve({ err: `ERR:${error}` });
            }
        };

        checkReply();
    });
}
