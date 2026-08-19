// PDF коммерческого предложения по SEO.
//
// Формат — 16:9, 720×405 pt: ровно канва презентации дизайнера, поэтому
// координаты из макетов переносятся 1:1 (см. lib/pdf/theme.ts). Слайды живут
// в lib/pdf/slides/*, общие элементы — в lib/pdf/primitives.tsx, тексты —
// в lib/pitch.ts. Здесь только сборка документа.
//
// Порядок листов (продающая логика согласована ранее — не переставлять
// «заодно»): подход → цена → направления → команда → снятие возражений.
//
// Рендерится на сервере (@react-pdf/renderer). Фото менеджеров загружаются
// ДО рендера и приходят пропсом `photos` — документ синхронный.

import React from "react";
import { Document } from "@react-pdf/renderer";
import { calculateSchedule } from "../calc";
import { mergeCalcConfig } from "../calc-config";
import { COMPANY } from "../company";
import {
  PITCH_ABOUT,
  PITCH_DIRECTIONS,
  PITCH_GUARANTEES,
  PITCH_TEAM,
} from "../pitch";
import type { Proposal } from "../types";
import type { ProposalPhotos } from "./photos";
import { GreenSlide } from "./primitives";
import {
  ComplexSlide,
  EcosystemSlide,
  JourneySlide,
  NowSlide,
  OldSeoSlide,
} from "./slides/approach";
import { AnalyticsSlide } from "./slides/analytics";
import { AboutSlide, CasesSlide, ContactsSlide, ReviewsSlide } from "./slides/about";
import { CoverSlide } from "./slides/cover";
import { DirectionAboutSlide, DirectionWorksSlide } from "./slides/direction";
import { EstimateSlide } from "./slides/estimate";
import {
  CheapSlide,
  ExpectationsSlide,
  GuaranteesSlide,
  ToolsSlide,
} from "./slides/guarantees";
import { ProjectManagerSlide, TeamSlide } from "./slides/team";

/** Описания направлений по ключу (для новых ключей описания может не быть). */
const pitchByKey = Object.fromEntries(PITCH_DIRECTIONS.map((p) => [p.key, p]));

export function ProposalDocument({
  proposal,
  photos = {},
}: {
  proposal: Proposal;
  /** Фото менеджеров из `manager_photos` (см. lib/pdf/photos.ts). */
  photos?: ProposalPhotos;
}) {
  const { input, directions, meta } = proposal;
  // Считаем по снимку настроек этого КП: правка коэффициентов в «Настройках»
  // не должна менять цифры уже отправленного клиенту предложения.
  const calc = calculateSchedule(
    input,
    directions,
    mergeCalcConfig(proposal.calcConfig),
  );
  const calcByKey = Object.fromEntries(calc.perDirection.map((d) => [d.key, d]));

  // У старых КП менеджеров нет — показываем контакт по умолчанию.
  const manager = proposal.manager?.name ? proposal.manager : COMPANY.manager;
  const projectManager = proposal.projectManager?.name
    ? proposal.projectManager
    : COMPANY.manager;
  const clientLabel = meta?.clientName || input.siteName;

  return (
    <Document title={`КП по SEO — ${input.siteName}`} author={COMPANY.name}>
      <CoverSlide
        clientName={clientLabel}
        manager={manager}
        photo={photos.manager}
      />

      {/* ── Подход ── */}
      <NowSlide />
      <ComplexSlide />
      <OldSeoSlide />
      <EcosystemSlide />
      <JourneySlide />

      {/* ── Цена ── */}
      <EstimateSlide input={input} calc={calc} />

      {/*
        ── Направления: по два листа на каждое ──
        Описание показывается всегда, даже для выключенного направления (бейдж
        «не входит») — клиент видит весь спектр услуг. Состав работ — только
        когда направление активно: расписывать то, чего в предложении нет, незачем.
      */}
      {directions.flatMap((d) => {
        const c = calcByKey[d.key];
        const pitch = pitchByKey[d.key];
        const pages: React.ReactNode[] = [];

        if (pitch) {
          pages.push(
            <DirectionAboutSlide key={`${d.key}-about`} pitch={pitch} calc={c} />,
          );
        }
        if (c && c.activeMonths.length > 0) {
          pages.push(
            <DirectionWorksSlide
              key={`${d.key}-works`}
              direction={d}
              calc={c}
              durationMonths={calc.durationMonths}
            />,
          );
        }
        return pages;
      })}

      {/* ── Команда ── */}
      <GreenSlide
        title={[...PITCH_TEAM.divider.title]}
        subtitle={PITCH_TEAM.divider.subtitle}
      />
      <TeamSlide
        projectManager={projectManager}
        photo={photos.projectManager}
      />
      <ProjectManagerSlide
        manager={projectManager}
        photo={photos.projectManager}
      />
      <AnalyticsSlide />

      {/* ── Гарантии ── */}
      <GreenSlide
        title={PITCH_GUARANTEES.divider.title}
        subtitle={PITCH_GUARANTEES.divider.subtitle}
      />
      <GuaranteesSlide />
      <ExpectationsSlide />
      <CheapSlide />
      <ToolsSlide />

      {/* ── О компании и контакты ── */}
      <GreenSlide
        title={PITCH_ABOUT.divider.title}
        subtitle={PITCH_ABOUT.divider.subtitle}
      />
      <AboutSlide />
      <ReviewsSlide />
      <CasesSlide />
      <ContactsSlide />
    </Document>
  );
}
