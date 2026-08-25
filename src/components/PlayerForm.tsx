"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Input, Select } from "./ui/Input";
import { POSITIONS, type Player } from "@/lib/types";

interface PlayerFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  players: Player[];
  editPlayer?: Player | null;
}

export function PlayerForm({
  open,
  onClose,
  onSaved,
  players,
  editPlayer,
}: PlayerFormProps) {
  const [name, setName] = useState(editPlayer?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState(editPlayer?.photo_url ?? "");
  const [position, setPosition] = useState(editPlayer?.position ?? "cualquiera");
  const [referenceId, setReferenceId] = useState(
    editPlayer?.reference_player_id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editPlayer ? `/api/players/${editPlayer.id}` : "/api/players";
      const method = editPlayer ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          photo_url: photoUrl || null,
          position,
          ...(!editPlayer && referenceId && { reference_player_id: referenceId }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editPlayer ? "Editar jugador" : "Fichar jugador"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Juan Pérez"
        />
        <Input
          label="Foto (URL)"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />
        <Select
          label="Posición"
          value={position}
          onChange={(e) => setPosition(e.target.value as typeof position)}
          options={POSITIONS.map((p) => ({ value: p.value, label: p.label }))}
        />
        {!editPlayer && (
          <Select
            label="Nivel similar a... (opcional)"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            options={[
              { value: "", label: "Sin referencia (nivel promedio)" },
              ...players.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
