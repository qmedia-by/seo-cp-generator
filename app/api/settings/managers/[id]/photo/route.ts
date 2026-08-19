// Фото одного менеджера: сама картинка для <img>, загрузка и удаление.
//
// Байты лежат в таблице `manager_photos` (см. lib/manager-photos.ts), а не в
// jsonb со справочником, поэтому и отдельная ручка: список менеджеров остаётся
// лёгким, а картинки браузер тянет и кэширует сам.

import { NextResponse } from "next/server";
import { parsePhotoDataUrl } from "@/lib/manager-photos";
import {
  deleteManagerPhoto,
  getManagerPhoto,
  saveManagerPhoto,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  const { id } = await params;
  const photo = await getManagerPhoto(id);
  if (!photo) {
    return NextResponse.json({ error: "Фото не найдено" }, { status: 404 });
  }

  // Адрес всегда со штампом версии (?v=…), поэтому картинку можно кэшировать
  // «навсегда»: заменили фото — сменился и адрес. ETag — на случай запроса без
  // штампа (тогда браузер хотя бы переспросит дёшево).
  const etag = `"${photo.version}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  // Buffer напрямую TS не пускает в BodyInit — оборачиваем в Uint8Array.
  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Content-Length": String(photo.bytes.length),
      ETag: etag,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

/** Загрузить/заменить фото: `{ data: "data:image/jpeg;base64,…" }`. */
export async function PUT(req: Request, { params }: Context) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });
  }

  try {
    const photo = parsePhotoDataUrl((body as { data?: unknown })?.data);
    return NextResponse.json({ photoVersion: await saveManagerPhoto(id, photo) });
  } catch (err) {
    // parsePhotoDataUrl бросает уже человеческий текст (формат, размер).
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Не удалось сохранить фото" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  const { id } = await params;
  await deleteManagerPhoto(id);
  return NextResponse.json({ photoVersion: null });
}
