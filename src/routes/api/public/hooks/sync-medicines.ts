import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/sync-medicines")({
  server: {
    handlers: {
      POST: async () => {
        const { runTimemedicoSync } = await import("@/lib/sync-medicines.server");
        const result = await runTimemedicoSync();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
      GET: async () => {
        const { runTimemedicoSync } = await import("@/lib/sync-medicines.server");
        const result = await runTimemedicoSync();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});