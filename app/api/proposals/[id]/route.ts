import { NextResponse } from "next/server";
import { deleteProposal, getProposal } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "КП не найдено" }, { status: 404 });
  }
  return NextResponse.json(proposal);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteProposal(id);
  if (!ok) {
    return NextResponse.json({ error: "КП не найдено" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
