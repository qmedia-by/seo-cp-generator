// Слайды о команде (макеты 20 и 21): состав профильной команды и персональный
// Project-менеджер проекта.
//
// Project-менеджер выбирается при создании КП независимо от менеджера, который
// КП подготовил, поэтому его фото, имя, должность и ссылка на резюме приезжают
// из `Proposal.projectManager`, а не из статичных текстов.

import React from "react";
import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import { COMPANY } from "../../company";
import { PITCH_PM, PITCH_TEAM } from "../../pitch";
import type { ProposalManager } from "../../types";
import { TEAM_PHOTO } from "../assets";
import type { PdfPhoto } from "../photos";
import {
  Avatar,
  Bullets,
  Kicker,
  NoteBox,
  Slide,
  SlideHead,
  rich,
} from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  cols: { flexDirection: "row", gap: 20, marginTop: 6 },
  col: { flex: 1 },

  // --- Профильная команда ---
  role: { flexDirection: "row", marginBottom: 15 },
  roleBody: { flex: 1, marginLeft: 10 },
  roleTitle: { fontSize: 11, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  roleTitlePlate: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  roleText: { fontSize: 9, lineHeight: 1.35, color: DECK.ink },
  // Скрепку убрали по правке заказчика — плашка идёт во всю ширину колонки.
  teamNote: { marginTop: 6, paddingVertical: 11, paddingHorizontal: 13 },
  teamNoteLine: { fontSize: 9.5, lineHeight: 1.5 },

  // --- Project-менеджер ---
  pmLead: { fontSize: 11, lineHeight: 1.4, marginBottom: 16 },
  pmCard: {
    backgroundColor: DECK.card,
    borderRadius: R.lg,
    padding: 14,
    flexDirection: "row",
  },
  pmCardBody: { flex: 1, marginLeft: 14 },
  pmName: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 4,
    marginBottom: 5,
  },
  pmNameText: { fontSize: 15, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  pmRole: { fontSize: 10.5, color: DECK.ink, marginBottom: 8 },
  pmResume: {
    fontSize: 10,
    color: DECK.grey,
    textDecoration: "underline",
    marginBottom: 10,
  },
  pmContact: { fontSize: 10, color: DECK.ink, textDecoration: "none", marginBottom: 3 },
  /**
   * Вывод слайда — жёлтая плашка во всю ширину листа (правка заказчика: было
   * узкой врезкой в правой колонке, с иконкой-лайком; иконку убрали).
   */
  pmNotePlate: {
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  pmNote: {
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: 700,
    color: DECK.black,
    lineHeight: 1.35,
  },
});

/** Одна роль в составе команды: аватар, название на жёлтой плашке, описание. */
function Role({
  title,
  text,
  photo,
  name,
}: {
  title: string;
  text: string;
  photo?: PdfPhoto | string;
  /** Чьи инициалы показать, если фото нет (у Project-менеджера — его имя). */
  name?: string;
}) {
  return (
    <View style={s.role} wrap={false}>
      <Avatar src={photo ?? null} name={name || title} size={38} />
      <View style={s.roleBody}>
        <View style={[s.roleTitlePlate, platePadding(11, 3.5)]}>
          <Text style={s.roleTitle}>{title}</Text>
        </View>
        <Text style={s.roleText}>{clean(text)}</Text>
      </View>
    </View>
  );
}

/**
 * Макет 20 — профильная команда. Аватарка Project-менеджера берётся из КП:
 * это тот же человек, что и на следующем слайде, и статичного фото для него
 * быть не может.
 */
export function TeamSlide({
  projectManager,
  photo,
}: {
  projectManager?: ProposalManager;
  photo?: PdfPhoto;
}) {
  const roles = PITCH_TEAM.roles.map((r) => ({
    title: r.title,
    text: r.text,
    photo: r.photo
      ? TEAM_PHOTO[r.photo as keyof typeof TEAM_PHOTO]
      : photo ?? undefined,
    name: r.photo ? r.title : projectManager?.name || r.title,
  }));
  const left = roles.slice(0, 4);
  const right = roles.slice(4);

  return (
    <Slide>
      <SlideHead
        title={PITCH_TEAM.title}
        subtitle={PITCH_TEAM.subtitle}
        size={24}
        subSize={15}
      />
      <View style={s.cols}>
        <View style={s.col}>
          {left.map((r) => (
            <Role key={r.title} {...r} />
          ))}
        </View>
        <View style={s.col}>
          {right.map((r) => (
            <Role key={r.title} {...r} />
          ))}
          <NoteBox style={s.teamNote}>
            {PITCH_TEAM.notes.map((n) => (
              <Text key={n} style={s.teamNoteLine}>
                {clean(n)}
              </Text>
            ))}
          </NoteBox>
        </View>
      </View>
    </Slide>
  );
}

/**
 * Макет 21 — Project-менеджер проекта.
 *
 * Относительно макета слайд упрощён по решению заказчика: убраны ссылка
 * «видеовизитка» и список личных достижений (вести его на каждого менеджера
 * накладно). Вместо них в карточке — то, что и так есть в справочнике:
 * должность и кликабельные контакты.
 */
export function ProjectManagerSlide({
  manager,
  photo,
}: {
  manager: ProposalManager;
  photo?: PdfPhoto;
}) {
  const name = manager.name || COMPANY.manager.name;
  const role = manager.role || COMPANY.manager.role;

  return (
    <Slide>
      <SlideHead title={PITCH_PM.title} size={24} />
      <View style={s.cols}>
        <View style={s.col}>
          <Text style={s.pmLead}>{rich(PITCH_PM.lead)}</Text>
          <View style={s.pmCard} wrap={false}>
            <Avatar src={photo ?? null} name={name} size={68} ring={2.5} />
            <View style={s.pmCardBody}>
              <View style={[s.pmName, platePadding(15, 4.5)]}>
                <Text style={s.pmNameText}>{name}</Text>
              </View>
              {!!role && <Text style={s.pmRole}>{role}</Text>}
              {!!manager.resumeUrl && (
                <Link src={manager.resumeUrl} style={s.pmResume}>
                  {PITCH_PM.resumeLabel}
                </Link>
              )}
              {!!manager.phone && (
                <Link
                  src={`tel:${manager.phone.replace(/[^\d+]/g, "")}`}
                  style={s.pmContact}
                >
                  {manager.phone}
                </Link>
              )}
              {!!manager.email && (
                <Link src={`mailto:${manager.email}`} style={s.pmContact}>
                  {manager.email}
                </Link>
              )}
            </View>
          </View>
        </View>

        <View style={s.col}>
          <Kicker style={{ fontSize: 11.5, marginBottom: 8 }}>{PITCH_PM.doTitle}</Kicker>
          <Bullets items={PITCH_PM.does} size={11} gap={9} />
        </View>
      </View>

      <View style={[s.pmNotePlate, platePadding(11, 11)]}>
        <Text style={s.pmNote}>{clean(PITCH_PM.note)}</Text>
      </View>
    </Slide>
  );
}
