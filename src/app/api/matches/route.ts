import { NextResponse } from "next/server";
import { fetchMatches } from "@/lib/db";
import { formatError } from "@/lib/errors";

export async function GET() {
  try {
    const matches = await fetchMatches();
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al cargar partidos") },
      { status: 500 }
    );
  }
}
