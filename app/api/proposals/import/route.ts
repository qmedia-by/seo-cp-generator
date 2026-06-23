import { NextResponse } from "next/server";
import { buildProposal, saveProposal } from "@/lib/storage";
import { createProposalSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Импорт ранее сохранённого JSON: берём только input/directions/meta,
// заново считаем расчёт и сохраняем как новое КП (новый id и дата).
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
      {
        error: "Файл не похож на КП: не хватает корректных полей input/directions",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const proposal = buildProposal(parsed.data);
  await saveProposal(proposal);
  return NextResponse.json(proposal, { status: 201 });
}
