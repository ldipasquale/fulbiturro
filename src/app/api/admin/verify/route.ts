import { NextResponse } from "next/server";
import { getAdminPin, isAdminPinValid } from "@/lib/admin-server";

export async function POST(request: Request) {
  if (!getAdminPin()) {
    return NextResponse.json(
      { error: "ADMIN_PIN no configurado en el servidor" },
      { status: 503 }
    );
  }

  try {
    const { pin } = await request.json();
    if (!isAdminPinValid(pin)) {
      return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const pin = request.headers.get("x-admin-pin");
  return NextResponse.json({ unlocked: isAdminPinValid(pin) });
}
