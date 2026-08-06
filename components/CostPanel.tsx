"use client";

import { useMemo } from "react";
import { calculateSchedule } from "@/lib/calc";
import type { CalcConfig } from "@/lib/calc-config";
import { formatHours, formatMoney, pluralMonths } from "@/lib/format";
import type { DirectionSelection, ProposalInput } from "@/lib/types";

export default function CostPanel({
  input,
  directions,
  config,
}: {
  input: ProposalInput;
  directions: DirectionSelection[];
  config: CalcConfig;
}) {
  const calc = useMemo(
    () => calculateSchedule(input, directions, config),
    [input, directions, config],
  );

  return (
    <div className="rounded-2xl bg-brand-gradient text-white p-5 sticky top-6 shadow-md">
      <div className="text-white text-sm font-bold uppercase tracking-wide">
        Расчёт стоимости
      </div>

      <table className="w-full mt-4 text-sm">
        <tbody>
          {calc.perDirection.map((d) => {
            const included = d.activeMonths.length > 0;
            const discounted = d.totalFullPrice > d.totalPrice;
            return (
              <tr
                key={d.key}
                className={included ? "align-top" : "text-white/35"}
              >
                <td className="py-1.5 pr-2 align-top">
                  <span className={included ? "" : "line-through"}>{d.name}</span>
                  <span className="block text-[10px] text-white/55 leading-tight">
                    {included ? d.monthsLabel : "не входит"}
                  </span>
                </td>
                <td className="py-1.5 pl-2 text-right whitespace-nowrap font-medium align-top">
                  {included ? (
                    discounted ? (
                      <span className="inline-flex flex-col items-end leading-tight">
                        <span className="text-white/40 line-through text-xs">
                          {formatMoney(d.totalFullPrice)}
                        </span>
                        <span>{formatMoney(d.totalPrice)}</span>
                      </span>
                    ) : (
                      formatMoney(d.totalPrice)
                    )
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Помесячные итоги */}
      <div className="border-t border-white/15 mt-3 pt-3">
        <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">
          По месяцам
        </div>
        <div className="space-y-1">
          {calc.months.map((m) => (
            <div
              key={m.month}
              className="flex items-baseline justify-between text-xs"
            >
              <span className="text-white/55">Месяц {m.month}</span>
              <span className="text-white/90">
                {formatMoney(m.monthlyTotalPrice)}
                <span className="text-white/40 ml-1.5">
                  {formatHours(m.monthlyTotalHours)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/15 mt-3 pt-3 space-y-2">
        {calc.totalDiscount > 0 && (
          <>
            <Row
              label="Без скидки за срок"
              value={formatMoney(calc.totalFullPrice)}
            />
            <div className="flex items-baseline justify-between text-brand-yellow">
              <span className="text-sm">Скидка за срок</span>
              <span className="font-semibold">
                −{formatMoney(calc.totalDiscount)}
              </span>
            </div>
          </>
        )}
        <Row label="Срок" value={pluralMonths(calc.durationMonths)} />
        <div className="rounded-xl bg-brand-yellow text-brand-ink px-4 py-3 mt-2">
          <div className="text-xs font-semibold uppercase opacity-70">
            Итого за {pluralMonths(calc.durationMonths)}
          </div>
          <div className="text-2xl font-extrabold leading-tight">
            {formatMoney(calc.totalPrice)}
          </div>
          <div className="text-xs opacity-70">
            {formatHours(calc.totalHours)} работ
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-right">
        <span className="font-semibold">{value}</span>
        {sub && <span className="text-white/50 text-xs ml-2">{sub}</span>}
      </span>
    </div>
  );
}
