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
    action: string | 'showLoding' | 'hideLoading',
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