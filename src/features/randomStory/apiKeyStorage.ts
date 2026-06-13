import { openDB, type DBSchema } from 'idb';

const SETTINGS_DB_NAME = 'trpg-maptool-settings';
const SETTINGS_DB_VERSION = 1;
const STORE_NAME = 'secrets';
const API_KEY_ID = 'deepseek-api-key';

interface SettingsDB extends DBSchema {
  secrets: {
    key: string;
    value: {
      id: string;
      value: string;
    };
  };
}

const dbPromise = openDB<SettingsDB>(SETTINGS_DB_NAME, SETTINGS_DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

export async function getApiKey(): Promise<string | null> {
  const record = await (await dbPromise).get(STORE_NAME, API_KEY_ID);
  return record?.value ?? null;
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await (await dbPromise).put(STORE_NAME, {
    id: API_KEY_ID,
    value: apiKey.trim(),
  });
}

export async function deleteApiKey(): Promise<void> {
  await (await dbPromise).delete(STORE_NAME, API_KEY_ID);
}
