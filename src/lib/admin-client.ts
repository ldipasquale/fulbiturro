const STORAGE_KEY = "fulbito-admin-pin";

export function getStoredAdminPin(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredAdminPin(pin: string) {
  sessionStorage.setItem(STORAGE_KEY, pin);
}

export function clearStoredAdminPin() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function tryUnlockWithPin(pin: string): Promise<boolean> {
  const res = await fetch("/api/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) return false;
  setStoredAdminPin(pin);
  return true;
}

export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const pin = getStoredAdminPin();
  const headers = new Headers(init?.headers);
  if (pin) headers.set("X-Admin-Pin", pin);
  return fetch(input, { ...init, headers });
}

export const ADMIN_PIN_LENGTH = Number(process.env.NEXT_PUBLIC_ADMIN_PIN_LENGTH ?? "6");
