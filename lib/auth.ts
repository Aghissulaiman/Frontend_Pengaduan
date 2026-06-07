// lib/auth.ts
export interface User {
  id: number;
  username: string;
  email: string;
  fullname: string;
  role: string;
  province_api_id?: number;
}

export function setAuthCookies(token: string, user: User) {
  document.cookie = `token=${token}; path=/; max-age=86400`;
  document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
}

export function removeAuthCookies() {
  document.cookie = 'token=; path=/; max-age=0';
  document.cookie = 'user=; path=/; max-age=0';
}

export function getTokenFromCookie(): string | null {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export function getUserFromCookie(): User | null {
  const match = document.cookie.match(/user=([^;]+)/);
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      return null;
    }
  }
  return null;
}