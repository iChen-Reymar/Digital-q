import { getStaffDesk } from "@/server/queries";

export async function GET(request: Request) {
  const counterId = new URL(request.url).searchParams.get("counter");
  try {
    const result = await getStaffDesk(counterId);
    const status = result.ok ? 200 : result.error === "unauthorized" ? 401 : 400;
    return Response.json(result, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "request_failed" }, { status: 503 });
  }
}
