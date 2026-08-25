# Fulbito ⚽

App para registrar partidos de fútbol 5 vs 5, ver estadísticas por jugador y sugerir equipos balanceados.

## Stack

- **Next.js 16** (React + API routes)
- **Supabase** (PostgreSQL, free tier)
- **Tailwind CSS**
- Deploy en **Vercel** (free tier)

## Setup local

### 1. Crear proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá un proyecto gratis.
2. En el **SQL Editor**, ejecutá el contenido de `supabase/schema.sql`.
3. En **Settings → API**, copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editá `.env.local` con tus credenciales de Supabase.

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

> **Nota:** Next.js 16 requiere Node.js >= 20.9. Si tenés una versión anterior, instalá Node 20+ con [nvm](https://github.com/nvm-sh/nvm).

## Deploy en Vercel

1. Subí el repo a GitHub.
2. Importá el proyecto en [vercel.com](https://vercel.com).
3. Agregá las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Tu app quedará en `tu-proyecto.vercel.app`.

## Funcionalidades

### Jugadores
- Nombre, apodo, foto (URL), posición
- Al crear uno nuevo, podés emparejarlo con un jugador existente para heredar su nivel ELO inicial

### Partidos
- Resultado por goles (con empates)
- Fecha y cancha
- 5 jugadores por equipo; el resto del plantel puede quedar afuera

### Estadísticas
- Partidos jugados, victorias, empates, derrotas, % victorias
- Goles a favor/en contra del equipo (no goleadores individuales)
- Racha actual y forma reciente (últimos 5)
- Mejores compañeros y rivales más difíciles
- Rating ELO que se actualiza con cada partido

### Sugerir equipos
- Seleccionás los 10 jugadores del día
- Si hay jugadores nuevos (sin partidos), te pide emparejarlos con alguien existente
- El algoritmo balancea equipos usando ELO, forma reciente, posiciones y química entre compañeros
- Podés pedir otra combinación (hasta 126 posibles)

## Seguridad

La app no tiene login — es para uso personal. Solo vos tenés la URL. No compartas el link públicamente si no querés que otros vean o modifiquen los datos.
