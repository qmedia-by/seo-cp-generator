import Wizard from "@/components/Wizard";
import { getCalcConfigOrDefault, getManagersOrDefault } from "@/lib/settings";

// Настройки расчёта и справочник менеджеров читаются из БД при каждом заходе.
export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const [config, managers] = await Promise.all([
    getCalcConfigOrDefault(),
    getManagersOrDefault(),
  ]);

  return <Wizard config={config} managers={managers} />;
}
