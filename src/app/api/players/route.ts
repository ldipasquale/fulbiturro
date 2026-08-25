import { NextResponse } from "next/server";
import { fetchPlayers } from "@/lib/db";
import { formatError } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import type { Position } from "@/lib/types";

export async function GET() {
  try {
    const players = await fetchPlayers();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al cargar jugadores") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, photo_url, position, reference_player_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const supabase = createSupabaseClient();
    let elo_rating = 1000;

    if (reference_player_id) {
      const { data: ref } = await supabase
        .from("players")
        .select("elo_rating")
        .eq("id", reference_player_id)
        .single();
      if (ref) elo_rating = ref.elo_rating;
    }

    const { data, error } = await supabase
      .from("players")
      .insert({
        name: name.trim(),
        photo_url: photo_url?.trim() || null,
        position: (position as Position) || "cualquiera",
        reference_player_id: reference_player_id || null,
        elo_rating,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: formatError(error, "Error al crear jugador") },
      { status: 500 }
    );
  }
}
