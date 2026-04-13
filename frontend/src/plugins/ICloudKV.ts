import { registerPlugin } from '@capacitor/core';

export interface ICloudKVPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
  addListener(
    event: 'externalChange',
    handler: () => void
  ): Promise<{ remove: () => void }>;
}

// No-op web implementation — iCloud KV is iOS only
const webImpl: ICloudKVPlugin = {
  get: async () => ({ value: null }),
  set: async () => {},
  remove: async () => {},
  addListener: async () => ({ remove: () => {} }),
};

export const ICloudKV = registerPlugin<ICloudKVPlugin>('ICloudKV', {
  web: webImpl,
});
