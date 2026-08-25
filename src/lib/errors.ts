export function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: string; details?: string; hint?: string };
    if (e.message) {
      if (
        e.message.includes("Could not find the table") ||
        e.message.includes("does not exist")
      ) {
        return "Las tablas no existen en Supabase. Ejecutá supabase/schema.sql en el SQL Editor.";
      }
      return e.details ? `${e.message}: ${e.details}` : e.message;
    }
  }
  return fallback;
}
