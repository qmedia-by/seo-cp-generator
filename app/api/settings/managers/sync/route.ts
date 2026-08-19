import { NextResponse } from "next/server";
import {
  fetchQmediaManagers,
  fetchQmediaPhotos,
  mergeManagersFromSite,
  QMEDIA_CONTACTS_URL,
  type ManagersSyncPlan,
} from "@/lib/qmedia-managers";
import { getManagers, saveManagers, saveManagerPhotos } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Синхронизация справочника с qmedia.by.
 *
 * GET  — предпросмотр: что добавится/обновится/удалится (ничего не пишет).
 * POST — применить. План считается заново, а не берётся с клиента: так на
 *        сервер нельзя прислать «свой» список под видом синхронизации.
 *
 * Аватарки качаются и в предпросмотре: сравнивать их иначе не с чем, а
 * менеджер, у которого поменялось только фото, обязан попасть в план — иначе
 * кнопки «Применить» пользователь не увидит.
 */
async function buildPlan(): Promise<ManagersSyncPlan> {
  const [current, site] = await Promise.all([getManagers(), fetchQmediaManagers()]);
  const photos = await fetchQmediaPhotos(site.map((s) => s.photoUrl));
  return mergeManagersFromSite(current, site, { photos });
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : "Неизвестная ошибка";
  console.error("Синхронизация менеджеров с qmedia.by:", err);
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET() {
  try {
    // Ни списка, ни тем более байтов картинок клиенту не отдаём — только сводку.
    const { managers: _next, photos: _photos, ...summary } = await buildPlan();
    return NextResponse.json({ ...summary, source: QMEDIA_CONTACTS_URL });
  } catch (err) {
    return fail(err);
  }
}

export async function POST() {
  try {
    const { managers, photos, ...summary } = await buildPlan();
    // Сначала список: `saveManagers` заодно убирает фото тех, кого удалили.
    // Потом картинки — их владельцы в списке уже есть.
    await saveManagers(managers);
    await saveManagerPhotos(photos);
    return NextResponse.json({
      ...summary,
      source: QMEDIA_CONTACTS_URL,
      managers: await getManagers(),
    });
  } catch (err) {
    return fail(err);
  }
}
