import { NextResponse } from "next/server";
import { getWorksConfig, saveWorksConfig } from "@/lib/settings";
import { worksConfigSchema } from "@/lib/validation";
import { mergeWorksConfig } from "@/lib/works-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ works: await getWorksConfig() });
}

/**
 * Сохранить списки работ целиком. Добавление/правка/удаление на клиенте — это
 * изменение списка, поэтому отдельных методов на работу не нужно.
 */
export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  const parsed = worksConfigSchema.safeParse(
    (body as { works?: unknown })?.works ?? body,
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Ошибка валидации списков работ",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // mergeWorksConfig канонизирует: чистит пробелы и убирает дубли.
  const works = mergeWorksConfig(parsed.data);
  await saveWorksConfig(works);
  return NextResponse.json({ works });
}
