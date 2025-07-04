// AESCrypto.ts
class AESCrypto {
    private algorithm: string = 'AES-GCM';
    private key: CryptoKey | null = null;

    async generateKey(): Promise<void> {
        this.key = await crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(data: string): Promise<{ iv: string; encrypted: string }> {
        if (!this.key) {
            throw new Error('Key is not initialized');
        }

        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
        const encodedData = new TextEncoder().encode(data);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            this.key,
            encodedData
        );

        return {
            iv: this.arrayBufferToBase64(iv),
            encrypted: this.arrayBufferToBase64(encrypted)
        };
    }

    async decrypt(iv: string, encrypted: string): Promise<string> {
        if (!this.key) {
            throw new Error('Key is not initialized');
        }

        const ivBuffer = this.base64ToArrayBuffer(iv);
        const encryptedBuffer = this.base64ToArrayBuffer(encrypted);

        const decrypted = await crypto.subtle.decrypt(
            {
                name: this.algorithm,
                iv: ivBuffer
            },
            this.key,
            encryptedBuffer
        );

        return new TextDecoder().decode(decrypted);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const byteArray = new Uint8Array(buffer);
        const binaryString = Array.from(byteArray)
            .map(byte => String.fromCharCode(byte))
            .join('');
        return btoa(binaryString);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

export default AESCrypto;
