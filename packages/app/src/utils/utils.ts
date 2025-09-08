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

export function showLoading() {
    onEvent('showLoading');
}

export function hideLoading() {
    onEvent('hideLoading');
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

export function dataURItoBlob(dataURI: string) {
    // Split the Data URI to get the MIME type and base64 data
    const splitDataURI = dataURI.split(',');
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
    const base64String = splitDataURI[1];

    // Convert base64 to raw binary data
    const byteString = atob(base64String);

    // Write the bytes of the string to an ArrayBuffer
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
}

export function downloadFile(url: string, filename: string) {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    // Set the download filename
    link.download = filename;
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function formatSize(bytes: number, decimals = 1) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'K', 'M', 'G', 'T'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function formatDateYYYYMMDD(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
export function formatDuration(seconds: number, options = {}) {
    if (seconds === 0) return '0s';

    const {
        showHours = true,
        showMinutes = true,
        showSeconds = true,
        compact = false,
        padding = false
    } = options as any;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];

    if (showHours && hours > 0) {
        parts.push(padding && hours < 10 ? `0${hours}h` : `${hours}h`);
    }

    if (showMinutes && (minutes > 0 || hours > 0)) {
        if (compact && hours > 0 && minutes === 0) {
            // Skip minutes if 0 and compact mode
        } else {
            parts.push(padding && minutes < 10 ? `0${minutes}m` : `${minutes}m`);
        }
    }

    if (showSeconds && (secs > 0 || seconds === 0)) {
        if (compact && (hours > 0 || minutes > 0) && secs === 0) {
            // Skip seconds if 0 and compact mode
        } else {
            parts.push(padding && secs < 10 ? `0${secs}s` : `${secs}s`);
        }
    }

    return parts.join(compact ? '' : '');
}

export function bytesToDataURI(bytes: number[]) {
    // Convert byte array to Uint8Array
    const byteArray = new Uint8Array(bytes);

    // Create blob from bytes (assuming it's JPEG based on common Telegram format)
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Create FileReader to convert to data URI
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
export function bytesToDataURISync(bytes: any[], mimeType = 'image/jpeg') {
    const byteArray = new Uint8Array(bytes);
    //@ts-ignore
    const base64 = btoa(String.fromCharCode.apply(null, byteArray));
    return `data:${mimeType};base64,${base64}`;
}
