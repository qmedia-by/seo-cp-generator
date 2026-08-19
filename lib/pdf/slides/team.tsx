// Слайды о команде (макеты 20 и 21): состав профильной команды и персональный
// Project-менеджер проекта.
//
// Project-менеджер выбирается при создании КП независимо от менеджера, который
// КП подготовил, поэтому его фото, имя, должность и ссылка на резюме приезжают
// из `Proposal.projectManager`, а не из статичных текстов.

import React from "react";
import { Image, Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import { COMPANY } from "../../company";
import { PITCH_PM, PITCH_TEAM } from "../../pitch";
import type { ProposalManager } from "../../types";
import { ICON, TEAM_PHOTO } from "../assets";
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
  cols: { flexDirection: "row", gap: 20, marginTop: 2 },
  col: { flex: 1 },

  // --- Профильная команда ---
  role: { flexDirection: "row", marginBottom: 11 },
  roleBody: { flex: 1, marginLeft: 8 },
  roleTitle: { fontSize: 10.5, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  roleTitlePlate: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 3,
    marginBottom: 3,
  },
  roleText: { fontSize: 8.5, lineHeight: 1.3, color: DECK.ink },
  teamNote: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  clip: { width: 30, height: 30, marginRight: -12 },
  teamNoteBox: { flex: 1, paddingLeft: 18 },
  teamNoteLine: { fontSize: 8.5, lineHeight: 1.4 },

  // --- Project-менеджер ---
  pmLead: { fontSize: 10, lineHeight: 1.35, marginBottom: 12 },
  pmCard: {
    backgroundColor: DECK.card,
    borderRadius: R.lg,
    padding: 12,
    flexDirection: "row",
  },
  pmCardBody: { flex: 1, marginLeft: 12 },
  pmName: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 4,
    marginBottom: 5,
  },
  pmNameText: { fontSize: 14, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  pmRole: { fontSize: 10, color: DECK.ink, marginBottom: 6 },
  pmResume: {
    fontSize: 9.5,
    color: DECK.grey,
    textDecoration: "underline",
    marginBottom: 8,
  },
  pmContact: { fontSize: 9.5, color: DECK.ink, textDecoration: "none", marginBottom: 2 },
  pmNoteRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10 },
  thumb: { width: 30, height: 30, marginRight: 10, marginTop: 2 },
  pmNote: { fontSize: 9.5, fontStyle: "italic", lineHeight: 1.35, flex: 1 },
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
      <Avatar src={photo ?? null} name={name || title} size={34} />
      <View style={s.roleBody}>
        <View style={[s.roleTitlePlate, platePadding(10.5, 3)]}>
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
        size={22}
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
          {/* Скрепка «наезжает» на левый край плашки — как в макете. */}
          <View style={s.teamNote}>
            <Image src={ICON.clip} style={s.clip} />
            <NoteBox style={s.teamNoteBox}>
              {PITCH_TEAM.notes.map((n) => (
                <Text key={n} style={s.teamNoteLine}>
                  {clean(n)}
                </Text>
              ))}
            </NoteBox>
          </View>
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
      <SlideHead title={PITCH_PM.title} size={20} />
      <View style={s.cols}>
        <View style={s.col}>
          <Text style={s.pmLead}>{rich(PITCH_PM.lead)}</Text>
          <View style={s.pmCard} wrap={false}>
            <Avatar src={photo ?? null} name={name} size={62} />
            <View style={s.pmCardBody}>
              <View style={[s.pmName, platePadding(14, 4)]}>
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
          <Kicker style={{ fontSize: 10 }}>{PITCH_PM.doTitle}</Kicker>
          <Bullets items={PITCH_PM.does} size={10} gap={6} />
          <View style={s.pmNoteRow}>
            <Image src={ICON.thumb} style={s.thumb} />
            <Text style={s.pmNote}>{clean(PITCH_PM.note)}</Text>
          </View>
        </View>
      </View>
    </Slide>
  );
}
