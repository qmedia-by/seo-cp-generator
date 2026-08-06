"use client";

import { useState } from "react";
import Link from "next/link";
import SettingsCalc from "./SettingsCalc";
import SettingsManagers from "./SettingsManagers";
import SettingsWorks from "./SettingsWorks";
import type { CalcConfig } from "@/lib/calc-config";
import type { WorksConfig } from "@/lib/works-config";
import type { Manager } from "@/lib/types";

const TABS = [
  { id: "calc", label: "Данные для расчёта" },
  { id: "works", label: "Работы направлений" },
  { id: "managers", label: "Список менеджеров" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsView({
  initialConfig,
  initialWorks,
  initialManagers,
}: {
  initialConfig: CalcConfig;
  initialWorks: WorksConfig;
  initialManagers: Manager[];
}) {
  const [tab, setTab] = useState<TabId>("calc");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold">Настройки</h2>
          <p className="text-sm text-brand-gray">
            Ставки и коэффициенты расчёта, заготовки работ по направлениям и
            справочник менеджеров.
          </p>
        </div>
        <Link href="/" className="ui-btn-ghost">
          ← К списку КП
        </Link>
      </div>

      <div className="flex gap-2 mb-5 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition ${
              tab === t.id
                ? "border-brand-green text-brand-greenDark"
                : "border-transparent text-brand-gray hover:text-brand-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "calc" && <SettingsCalc initialConfig={initialConfig} />}
      {tab === "works" && <SettingsWorks initialWorks={initialWorks} />}
      {tab === "managers" && (
        <SettingsManagers initialManagers={initialManagers} />
      )}
    </div>
  );
}
