import { NextResponse } from "next/server";
import { getCalcConfig } from "@/lib/settings";
import { buildProposal, saveProposal } from "@/lib/storage";
import { importProposalSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Импорт ранее сохранённого JSON: берём только input/directions/meta/manager,
// заново считаем расчёт и сохраняем как новое КП (новый id и дата).
// Расчёт идёт по ТЕКУЩИМ настройкам, а не по снимку из файла — это штатный
// способ пересчитать старое КП после правки коэффициентов.
// Схема здесь своя (`importProposalSchema`): менеджеры необязательны, иначе
// перестали бы открываться КП, сохранённые до того, как выбор человека стал
// обязательным.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  const parsed = importProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Файл не похож на КП: не хватает корректных полей input/directions",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const proposal = buildProposal(parsed.data, await getCalcConfig());
  await saveProposal(proposal);
  return NextResponse.json(proposal, { status: 201 });
}
