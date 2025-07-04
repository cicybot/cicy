export default class IndexedDbCache {
    private dbName: string;
    private storeName: string;
    private db?: IDBDatabase;

    constructor() {
        this.dbName = "db"
        this.storeName = "store"
    }

    init(db: string) {
        if (db.split("/").length !== 2) {
            throw new Error("Error IndexedDbCache db")
        }
        const [dbName, storeName] = db.split("/")
        this.dbName = dbName;
        this.storeName = storeName;
        return this;
    }

    async initDb() {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            request.onsuccess = () => {
                const db = request.result;
                // Check if the store exists before deciding to upgrade
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.close();
                    // Increase version only if the store doesn't exist
                    const newVersion = db.version + 1;
                    const upgradeRequest = indexedDB.open(this.dbName, newVersion);

                    upgradeRequest.onupgradeneeded = () => {
                        const upgradeDb = upgradeRequest.result;
                        upgradeDb.createObjectStore(this.storeName);
                    };

                    upgradeRequest.onsuccess = () => {
                        this.db = upgradeRequest.result;
                        resolve(this.db);
                    };

                    upgradeRequest.onerror = () => {
                        reject('Failed to upgrade IndexedDB: ' + upgradeRequest.error);
                    };
                } else {
                    this.db = db; // Use existing database
                    resolve(this.db);
                }
            };

            request.onerror = () => {
                reject('Failed to open IndexedDB: ' + request.error);
            };
        });
    }

    private transaction(storeName: string, mode: IDBTransactionMode = 'readonly') {
        if (!this.db) throw new Error("Database isn't initialized");

        if (!this.db.objectStoreNames.contains(storeName)) {
            throw new Error(`Object store ${storeName} not found in the database.`);
        }
        const tx = this.db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    async delete(key: string): Promise<void> {
        if (!this.db) await this.initDb();
        return new Promise<void>((resolve, reject) => {
            const store = this.transaction(this.storeName, 'readwrite');
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject('Failed to delete from IndexedDB: ' + request.error);
            };
        });
    }

    async put(key: string, value: any) {
        if (!this.db) await this.initDb();
        return new Promise<void>((resolve, reject) => {
            const store = this.transaction(this.storeName, 'readwrite');
            const request = store.put(value, key);
            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject('Failed to store data in IndexedDB: ' + request.error);
            };
        });
    }

    async get(key: string): Promise<any | null> {
        if (!this.db) await this.initDb();
        return new Promise((resolve, reject) => {
            const store = this.transaction(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => {
                reject('Failed to fetch from IndexedDB: ' + request.error);
            };
        });
    }

    async createIndex(indexName: string, keyPath: string, options?: IDBIndexParameters) {
        if (!this.db) await this.initDb();

        return new Promise<void>((resolve, reject) => {
            if (!this.db?.objectStoreNames.contains(this.storeName)) {
                reject('Object store does not exist');
                return;
            }

            const store = this.db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);

            if (!store.indexNames.contains(indexName)) {
                this.db.close();

                // Increment version to create the new index
                const newVersion = this.db.version + 1;
                const upgradeRequest = indexedDB.open(this.dbName, newVersion);

                upgradeRequest.onupgradeneeded = () => {
                    const upgradeDb = upgradeRequest.result;
                    const upgradeStore = upgradeDb.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
                    upgradeStore.createIndex(indexName, keyPath, options);
                };

                upgradeRequest.onsuccess = () => {
                    resolve();
                };

                upgradeRequest.onerror = () => {
                    reject('Failed to upgrade IndexedDB for creating index: ' + upgradeRequest.error);
                };
            } else {
                resolve(); // Index already exists, no need to modify version
            }
        });
    }

    async getAllByIndex(indexName: string, value: any): Promise<any[]> {
        if (!this.db) await this.initDb();
        return new Promise((resolve, reject) => {
            const store = this.transaction(this.storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject('Failed to fetch from IndexedDB using index: ' + request.error);
            };
        });
    }

    async getAll(): Promise<any[]> {
        if (!this.db) await this.initDb();
        return new Promise((resolve, reject) => {
            const store = this.transaction(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject('Failed to fetch all entries from IndexedDB: ' + request.error);
            };
        });
    }
    async deleteDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            deleteRequest.onsuccess = () => {
                console.log(`Database ${this.dbName} deleted successfully.`);
                resolve();
            };
    
            deleteRequest.onerror = () => {
                console.error(`Failed to delete database ${this.dbName}:`, deleteRequest.error);
                reject(deleteRequest.error);
            };
    
            deleteRequest.onblocked = () => {
                console.warn(`Database deletion blocked for ${this.dbName}.`);
            };
        });
    }
}
