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

/**
 * Checks if a string is a valid URL
 * @param url The URL string to validate
 * @returns boolean indicating if the URL is valid
 */
export function checkIsUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

export function onEvent(
    action: string | 'showLoading' | 'hideLoading',
    payload?: any,
    timeout?: number
) {
    setTimeout(() => {
        window.dispatchEvent(
            new CustomEvent('onEvent', {
                detail: {
                    action,
                    paylaod: {
                        ...payload
                    }
                }
            })
        );
    }, timeout || 0);
}

export async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32k chunks
    const chunks = [];

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    return btoa(chunks.join(''));
}

export const diffObj = (a: any, b: any) => {
    const keys = Object.keys(a);
    const keys1 = Object.keys(b);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (keys1.indexOf(key) === -1) {
            return true;
        }
    }
    for (let i = 0; i < keys1.length; i++) {
        const key = keys1[i];
        if (keys.indexOf(key) === -1) {
            return true;
        }
    }
    for (let i = 0; i < keys1.length; i++) {
        const key = keys1[i];
        if (a[key] !== b[key]) {
            return true;
        }
    }

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (a[key] !== b[key]) {
            return true;
        }
    }
    return false;
};

export function formatRelativeTime(
    timestamp?: number,
    options?: {
        exactAfterDays?: number;
    }
): string {
    if (!timestamp) return '-';

    const now = Date.now();
    const date = new Date(timestamp * 1000);
    const diffInSeconds = Math.floor((now - date.getTime()) / 1000);

    // Relative time formatting
    if (diffInSeconds < 5) return '刚刚';
    if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;

    // Exact date formatting after specified days (default 1 day)
    const exactAfterDays = options?.exactAfterDays ?? 1;
    if (diffInSeconds < exactAfterDays * 86400) {
        return `${Math.floor(diffInSeconds / 86400)}天前`;
    }

    // Return formatted date for older timestamps
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
