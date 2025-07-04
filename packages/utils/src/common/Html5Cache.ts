export default class Html5Cache {
    private cache?: Cache;
    private cacheName?: string;

    init(cacheName: string) {
        this.cacheName = cacheName;
        return this;
    }

    private async initCache(cacheName: string) {
        this.cache = await caches.open(cacheName);
        return this;
    }
    async getCache(){
        if (!this.cache) {
            await this.initCache(this.cacheName!);
        }
        return this.cache
    }

    async get(key: string) {
        if (!this.cache) {
            await this.initCache(this.cacheName!);
        }
        return this.cache!.match(new Request(this.handleKey(key))).then(
            (response) => {
                if (response) {
                    return response;
                } else {
                    return null;
                }
            },
        );
    }
    handleKey(key: string) {
        if (!key.startsWith("/")) {
            key = "/" + key;
        }
        return key;
    }
    async delete(key: string) {
        if (!this.cache) {
            await this.initCache(this.cacheName!);
        }
        return this.cache!.delete(this.handleKey(key));
    }

    async put(key: string, value: Blob | any) {
        if (!this.cache) {
            await this.initCache(this.cacheName!);
        }
        const response = new Response(value);
        return this.cache!.put(this.handleKey(key), response);
    }

    async putData(key: string, value: any) {
        if (!this.cache) {
            await this.initCache(this.cacheName!);
        }
        try {
            const response = new Response(
                new Blob([Buffer.from(JSON.stringify([value]))], {
                    type: "text/plain",
                }),
            );
            return this.cache!.put(this.handleKey(key), response);
        } catch (e) {
            console.error(e);
        }
    }

    async getData(key: string) {
        const res = await this.get(this.handleKey(key));
        if (!res) {
            return undefined;
        }
        const json = await res.json();
        if (json) {
            return json[0];
        } else {
            return undefined;
        }
    }
}
