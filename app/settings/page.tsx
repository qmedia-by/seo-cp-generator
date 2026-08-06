import SettingsView from "@/components/SettingsView";
import {
  getCalcConfigOrDefault,
  getManagersOrDefault,
  getWorksConfigOrDefault,
} from "@/lib/settings";

// Настройки читаются из БД при каждом заходе — кэшировать нечего.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [config, works, managers] = await Promise.all([
    getCalcConfigOrDefault(),
    getWorksConfigOrDefault(),
    getManagersOrDefault(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SettingsView
        initialConfig={config}
        initialWorks={works}
        initialManagers={managers}
      />
    </div>
  );
}
