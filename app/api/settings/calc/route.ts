import { NextResponse } from "next/server";
import { mergeCalcConfig } from "@/lib/calc-config";
import { getCalcConfig, resetCalcConfig, saveCalcConfig } from "@/lib/settings";
import { calcConfigSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ config: await getCalcConfig() });
}

/** Сохранить настройки расчёта целиком. */
export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  const parsed = calcConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации настроек", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // mergeCalcConfig приводит к каноническому виду (порядок коэффициентов, типы).
  const config = mergeCalcConfig(parsed.data);
  await saveCalcConfig(config);
  return NextResponse.json({ config });
}

/** Сброс к значениям по умолчанию (из sources/Расчет SEO.xlsx). */
export async function DELETE() {
  await resetCalcConfig();
  return NextResponse.json({ config: await getCalcConfig() });
}
