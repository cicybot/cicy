// @ts-ignore
import * as CryptoJS from 'crypto-js';
import { padKeyTo8Bytes, stringToHex } from './utils';

export function md5(message: string) {
    const salt = message.length > 2 ? message.substring(2) : 'salt';
    return CryptoJS.MD5('md5:' + salt + '/' + message).toString();
}

/**
 *
 * Usage example
 * const key = 'w1s2sa';
 * const desCrypto = new DESCrypto(key);
 *
 * const plaintext = 'Hello, World!';
 * const encrypted = desCrypto.encrypt(plaintext);
 * console.log('Encrypted:', encrypted);
 *
 * const decrypted = desCrypto.decrypt(encrypted);
 * console.log('Decrypted:', decrypted);
 */
export default class DESCrypto {
    private key: CryptoJS.lib.WordArray;

    constructor(key: string) {
        const key1 = padKeyTo8Bytes(key);
        this.key = CryptoJS.enc.Hex.parse(stringToHex(key1));
    }

    encrypt(plaintext: string): string {
        const encrypted = CryptoJS.DES.encrypt(plaintext, this.key, { mode: CryptoJS.mode.ECB });
        return encrypted.toString();
    }

    decrypt(ciphertext: string): string {
        const decrypted = CryptoJS.DES.decrypt(ciphertext, this.key, { mode: CryptoJS.mode.ECB });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}
