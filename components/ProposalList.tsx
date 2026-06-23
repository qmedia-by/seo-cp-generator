"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney, pluralMonths } from "@/lib/format";
import type { ProposalSummary } from "@/lib/storage";

export default function ProposalList() {
  const [items, setItems] = useState<ProposalSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/proposals");
      const data = await res.json();
      setItems(data.items);
    } catch {
      setError("Не удалось загрузить список");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Удалить это КП?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    load();
  };

  const onImportFile = async (file: File) => {
    setImporting(true);
    setError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/proposals/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось импортировать файл");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Файл не похож на сохранённое КП",
      );
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold">Сохранённые КП</h2>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="ui-btn-ghost"
          >
            {importing ? "Импорт…" : "Импорт JSON"}
          </button>
          <Link href="/new" className="ui-btn-accent">
            + Создать КП
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {items === null ? (
        <div className="text-brand-gray text-sm">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-brand-gray">
          Пока нет сохранённых КП. Нажмите «Создать КП».
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{it.siteName}</div>
                  <div className="text-xs text-brand-gray">
                    {formatDate(it.createdAt)} · {it.region} ·{" "}
                    {pluralMonths(it.durationMonths)} · {it.includedCount}/5
                    направлений
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="text-brand-gray hover:text-red-600 text-sm"
                  title="Удалить"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-xl font-extrabold">
                  {formatMoney(it.totalPrice)}
                </span>
                <span className="text-xs text-brand-gray">
                  {formatMoney(it.monthlyTotalPrice)} / мес
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <a
                  href={`/api/proposals/${it.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn-accent text-xs px-3 py-1.5"
                >
                  PDF
                </a>
                <a
                  href={`/api/proposals/${it.id}/xlsx`}
                  className="ui-btn-primary text-xs px-3 py-1.5"
                >
                  Excel
                </a>
                <a
                  href={`/api/proposals/${it.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn-ghost text-xs px-3 py-1.5"
                >
                  JSON
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
