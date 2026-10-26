import { useEffect } from 'react';
import { appConfig } from '../../config/app';

export function usePageTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${appConfig.name}` : `${appConfig.name} · ${appConfig.tagline}`;
  }, [title]);
}
