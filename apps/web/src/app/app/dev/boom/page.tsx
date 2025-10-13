'use client';
import { useEffect } from 'react';

export default function BoomClient() {
  useEffect(() => {
    throw new Error('preview 500');
  }, []);
  return null;
}