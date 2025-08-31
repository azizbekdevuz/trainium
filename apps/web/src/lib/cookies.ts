"use server";

import { cookies } from 'next/headers';

const CART_COOKIE = 'cart_id';
const ONE_YEAR = 60 * 60 * 24 * 365;

// Edge-safe UUID via Web Crypto (no Node 'crypto' import)
function newId() {
  return crypto.randomUUID();
}

export async function setCartId(id: string) {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR,
  });
}

export async function getOrSetCartId(): Promise<string> {
  const store = await cookies();
  let id = store.get(CART_COOKIE)?.value;
  if (!id) {
    id = newId();
    await setCartId(id);
  }
  return id;
}

export async function readCartId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

export async function clearCartCookie() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}