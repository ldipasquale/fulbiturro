import { NextResponse } from "next/server";

export function getAdminPin(): string | undefined {
  return process.env.ADMIN_PIN;
}

export function isAdminPinValid(pin: string | null | undefined): boolean {
  const expected = getAdminPin();
  if (!expected) return true;
  return pin === expected;
}

export function verifyAdminRequest(request: Request): boolean {
  return isAdminPinValid(request.headers.get("x-admin-pin"));
}

export function adminUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Modo edición bloqueado. Tipeá la clave secreta en el teclado." },
    { status: 401 }
  );
}
