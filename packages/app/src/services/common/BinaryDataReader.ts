export class BinaryDataReader {
    private data: Uint8Array;
    private offset: number;
    private view: DataView;

    constructor(data: Uint8Array) {
        if (!data?.buffer) {
            throw new Error('Invalid data provided to BinaryDataReader');
        }

        this.data = data;
        this.offset = 0;
        this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    readInt(): number {
        if (this.offset + 4 > this.data.byteLength) {
            throw new Error(
                `Attempt to read beyond buffer bounds (offset: ${this.offset}, length: ${this.data.byteLength})`
            );
        }

        const value = this.view.getInt32(this.offset, false); // false for big-endian
        this.offset += 4;
        return value;
    }

    readBytes(length: number): Uint8Array {
        if (this.offset + length > this.data.byteLength) {
            throw new Error(`Attempt to read ${length} bytes beyond buffer bounds`);
        }

        const bytes = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return bytes;
    }

    remaining(): number {
        return this.data.byteLength - this.offset;
    }
}
