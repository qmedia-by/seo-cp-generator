"use client";

import { useMemo } from "react";
import { calculate } from "@/lib/calc";
import { formatHours, formatMoney, pluralMonths } from "@/lib/format";
import type { DirectionSelection, ProposalInput } from "@/lib/types";

export default function CostPanel({
  input,
  directions,
}: {
  input: ProposalInput;
  directions: DirectionSelection[];
}) {
  const calc = useMemo(
    () => calculate(input, directions),
    [input, directions],
  );

  return (
    <div className="rounded-2xl bg-brand-black text-white p-5 sticky top-6">
      <div className="text-brand-yellow text-sm font-bold uppercase tracking-wide">
        Расчёт стоимости
      </div>

      <table className="w-full mt-4 text-sm">
        <tbody>
          {calc.perDirection.map((d) => (
            <tr
              key={d.key}
              className={d.included ? "" : "text-white/35 line-through"}
            >
              <td className="py-1.5 pr-2 align-top">{d.name}</td>
              <td className="py-1.5 px-2 text-right whitespace-nowrap text-white/60">
                {d.included ? formatHours(d.monthlyHours) : "—"}
              </td>
              <td className="py-1.5 pl-2 text-right whitespace-nowrap font-medium">
                {d.included ? formatMoney(d.monthlyPrice) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-white/15 mt-3 pt-3 space-y-2">
        <Row label="В месяц" value={formatMoney(calc.monthlyTotalPrice)} sub={formatHours(calc.monthlyTotalHours)} />
        <Row label="Срок" value={pluralMonths(calc.durationMonths)} />
        <div className="rounded-xl bg-brand-yellow text-brand-black px-4 py-3 mt-2">
          <div className="text-xs font-semibold uppercase opacity-70">
            Итого за {pluralMonths(calc.durationMonths)}
          </div>
          <div className="text-2xl font-extrabold leading-tight">
            {formatMoney(calc.totalPrice)}
          </div>
          <div className="text-xs opacity-70">{formatHours(calc.totalHours)} работ</div>
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
