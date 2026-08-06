import { NextResponse } from "next/server";
import {
  fetchQmediaManagers,
  mergeManagersFromSite,
  QMEDIA_CONTACTS_URL,
  type ManagersSyncPlan,
} from "@/lib/qmedia-managers";
import { getManagers, saveManagers } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Синхронизация справочника с qmedia.by.
 *
 * GET  — предпросмотр: что добавится/обновится/удалится (ничего не пишет).
 * POST — применить. План считается заново, а не берётся с клиента: так на
 *        сервер нельзя прислать «свой» список под видом синхронизации.
 */
async function buildPlan(): Promise<ManagersSyncPlan> {
  const [current, site] = await Promise.all([getManagers(), fetchQmediaManagers()]);
  return mergeManagersFromSite(current, site);
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : "Неизвестная ошибка";
  console.error("Синхронизация менеджеров с qmedia.by:", err);
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET() {
  try {
    const { managers: _next, ...summary } = await buildPlan();
    return NextResponse.json({ ...summary, source: QMEDIA_CONTACTS_URL });
  } catch (err) {
    return fail(err);
  }
}

export async function POST() {
  try {
    const { managers, ...summary } = await buildPlan();
    await saveManagers(managers);
    return NextResponse.json({
      ...summary,
      source: QMEDIA_CONTACTS_URL,
      managers: await getManagers(),
    });
  } catch (err) {
    return fail(err);
  }
}
