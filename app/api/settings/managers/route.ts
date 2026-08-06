import { NextResponse } from "next/server";
import { getManagers, saveManagers } from "@/lib/settings";
import { managersSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ managers: await getManagers() });
}

/**
 * Сохранить справочник целиком. Добавление/правка/удаление на клиенте — это
 * изменение списка, поэтому отдельных методов на менеджера не нужно.
 */
export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  const parsed = managersSchema.safeParse(
    (body as { managers?: unknown })?.managers ?? body,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации списка менеджеров", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await saveManagers(parsed.data);
  return NextResponse.json({ managers: await getManagers() });
}
