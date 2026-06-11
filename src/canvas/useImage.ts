/* 轻量图片加载 hook：dataUrl → 缓存的 HTMLImageElement（供 Konva.Image 使用）*/
import { useEffect, useState } from 'react';

const cache = new Map<string, HTMLImageElement>();

export function useImage(src: string): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(() => cache.get(src));

  useEffect(() => {
    const cached = cache.get(src);
    if (cached) {
      setImg(cached);
      return;
    }
    let alive = true;
    const el = new window.Image();
    el.onload = () => {
      cache.set(src, el);
      if (alive) setImg(el);
    };
    el.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  return img;
}
