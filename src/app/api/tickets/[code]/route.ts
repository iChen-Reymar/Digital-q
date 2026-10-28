import { getTicket } from "@/server/queries";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  try {
    const result = await getTicket(code);
    const status = result.ok ? 200 : result.error === "not_found" ? 404 : 400;
    return Response.json(result, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "request_failed" }, { status: 503 });
  }
}
