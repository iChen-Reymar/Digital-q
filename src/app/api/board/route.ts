import { getBoard } from "@/server/queries";

export async function GET(request: Request) {
  const counterId = new URL(request.url).searchParams.get("counter") ?? "";
  try {
    const result = await getBoard(counterId);
    const status = result.ok ? 200 : 404;
    return Response.json(result, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "request_failed" }, { status: 503 });
  }
}
