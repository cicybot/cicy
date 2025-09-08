export async function uploadFile(
    file: File,
    url: string,
    jwtToken: string = '',
    additionalData: Record<string, string> = {}
): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        let headers: Record<string, string> = {
            Accept: 'application/json'
        };
        if (jwtToken) {
            headers = {
                ...headers,
                Authorization: `Bearer ${jwtToken}`
            };
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}
