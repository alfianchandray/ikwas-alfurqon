'use client';

import { useEffect } from 'react';

export default function DynamicFavicon() {
  useEffect(() => {
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.favicon_url) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.favicon_url;
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
