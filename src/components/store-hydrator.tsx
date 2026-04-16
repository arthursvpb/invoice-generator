'use client';

import * as React from 'react';
import { useDraftStore } from '@/lib/store/draft-store';
import { useSettingsStore } from '@/lib/store/settings-store';

export function StoreHydrator() {
  React.useEffect(() => {
    void Promise.allSettled([
      Promise.resolve(useDraftStore.persist.rehydrate()),
      Promise.resolve(useSettingsStore.persist.rehydrate()),
    ]).then(() => {
      if (typeof document !== 'undefined') {
        document.body.dataset.hydrated = 'true';
      }
    });
  }, []);
  return null;
}
