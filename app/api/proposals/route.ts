import { NextResponse } from "next/server";
import { buildProposal, listProposals, saveProposal } from "@/lib/storage";
import { createProposalSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listProposals();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const proposal = buildProposal(parsed.data);
  await saveProposal(proposal);
  return NextResponse.json(proposal, { status: 201 });
}
