import Wizard from "@/components/Wizard";
import {
  getCalcConfigOrDefault,
  getManagersOrDefault,
  getWorksConfigOrDefault,
} from "@/lib/settings";

// Настройки расчёта, списки работ и справочник менеджеров читаются из БД
// при каждом заходе.
export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const [config, works, managers] = await Promise.all([
    getCalcConfigOrDefault(),
    getWorksConfigOrDefault(),
    getManagersOrDefault(),
  ]);

  return <Wizard config={config} works={works} managers={managers} />;
}
