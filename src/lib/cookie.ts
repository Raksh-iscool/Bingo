'use server'

import { cookies } from "next/headers";

export async function getCookie(name: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name)?.value;
    return cookie!;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
}