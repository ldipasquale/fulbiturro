import { NextResponse } from "next/server";
import { formatError } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import type { Position } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, photo_url, position } = body;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .update({
        ...(name !== undefined && { name: name.trim() }),
        ...(photo_url !== undefined && { photo_url: photo_url?.trim() || null }),
        ...(position !== undefined && { position: position as Position }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al actualizar jugador") },
      { status: 500 }
    );
  }
}
