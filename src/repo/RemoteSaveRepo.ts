import type { SaveRepo, Progression } from './progress';
import { withDefaults } from './progress';
import { apiGet, apiPut } from './api';

export class RemoteSaveRepo implements SaveRepo {
  private saveQueue: Promise<void> = Promise.resolve();

  constructor(readonly profileId: string) {}

  async load(): Promise<Progression> {
    try {
      const data = await apiGet<Progression | null>(`/api/profiles/${this.profileId}/progress`);
      return data ? withDefaults(data as Partial<Progression>) : withDefaults({});
    } catch (e) {
      console.error('[RemoteSaveRepo] 读取失败:', e);
      return withDefaults({});
    }
  }

  save(p: Progression): void {
    this.saveQueue = this.saveQueue
      .then(() => apiPut(`/api/profiles/${this.profileId}/progress`, p))
      .catch((e) => { console.error('[RemoteSaveRepo] 保存失败:', e); });
  }
}
