"use client";

import {
  ADMIN_PIN_LENGTH,
  clearStoredAdminPin,
  getStoredAdminPin,
  tryUnlockWithPin,
} from "@/lib/admin-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AdminContextValue {
  isUnlocked: boolean;
  isReady: boolean;
  unlockMessage: string | null;
  lock: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  isUnlocked: false,
  isReady: false,
  unlockMessage: null,
  lock: () => {},
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const bufferRef = useRef("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verifyStoredPin = useCallback(async () => {
    const pin = getStoredAdminPin();
    if (!pin) {
      setIsUnlocked(false);
      setIsReady(true);
      return;
    }
    const res = await fetch("/api/admin/verify", {
      method: "GET",
      headers: { "X-Admin-Pin": pin },
    });
    if (res.ok) {
      const data = await res.json();
      setIsUnlocked(!!data.unlocked);
      if (!data.unlocked) clearStoredAdminPin();
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    verifyStoredPin();
  }, [verifyStoredPin]);

  const lock = useCallback(() => {
    clearStoredAdminPin();
    setIsUnlocked(false);
    setUnlockMessage(null);
  }, []);

  useEffect(() => {
    if (isUnlocked) return;

    const resetBuffer = () => {
      bufferRef.current = "";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (!/^\d$/.test(e.key)) {
        resetBuffer();
        return;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      bufferRef.current += e.key;
      timeoutRef.current = setTimeout(resetBuffer, 2500);

      if (bufferRef.current.length >= ADMIN_PIN_LENGTH) {
        const attempt = bufferRef.current.slice(-ADMIN_PIN_LENGTH);
        resetBuffer();
        void tryUnlockWithPin(attempt).then((ok) => {
          if (ok) {
            setIsUnlocked(true);
            setUnlockMessage("Modo edición activado");
            setTimeout(() => setUnlockMessage(null), 3000);
          }
        });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isUnlocked]);

  return (
    <AdminContext.Provider value={{ isUnlocked, isReady, unlockMessage, lock }}>
      {unlockMessage && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg border border-gold/40 bg-card px-4 py-2 text-sm font-medium text-gold shadow-lg">
          {unlockMessage}
        </div>
      )}
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
