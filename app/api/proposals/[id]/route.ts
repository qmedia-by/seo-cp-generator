import { NextResponse } from "next/server";
import { deleteProposal, getProposal } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const proposal = await getProposal(params.id);
  if (!proposal) {
    return NextResponse.json({ error: "КП не найдено" }, { status: 404 });
  }
  return NextResponse.json(proposal);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ok = await deleteProposal(params.id);
  if (!ok) {
    return NextResponse.json({ error: "КП не найдено" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
