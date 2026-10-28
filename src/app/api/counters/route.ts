import { listPublicCounters } from "@/server/queries";

export async function GET() {
  try {
    const result = await listPublicCounters();
    return Response.json(result, {
      status: result.ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json({ ok: false, error: "request_failed" }, { status: 503 });
  }
}
