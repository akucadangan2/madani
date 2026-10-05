'use client';

import { useEffect } from 'react';

export default function ScrollBawah({ n }: { n: number }) {
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, [n]);
  return null;
}