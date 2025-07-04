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

export const isAndroid = () => {
    return navigator.userAgent.toLowerCase().indexOf('android') > -1;
};

export async function arrayBufferToDataUri(arrayBuffer: ArrayBuffer, mimeType: string) {
    return new Promise(resolve => {
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);

        reader.readAsDataURL(blob);
    });
}

export function isAndroidApp() {
    //@ts-ignore
    return !!getAndroidAppApi();
}

export function getAndroidAppApi() {
    //@ts-ignore
    return window['__AndroidAPI'];
}
