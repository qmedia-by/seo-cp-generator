// Блок «О компании» (макеты 33–36): факты о Qmedia, отзывы, кейсы и контакты.
//
// Все внешние адреса вынесены в `LINKS` / `SOCIALS` (lib/company.ts) — в
// макетах эти ссылки живые, и в PDF они должны остаться кликабельными.

import React from "react";
import { Image, Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import { COMPANY, LINKS, SOCIALS } from "../../company";
import { PITCH_ABOUT, PITCH_CASES, PITCH_CONTACTS, PITCH_REVIEWS } from "../../pitch";
import {
  AWARD,
  CASE_COVER,
  CLIENTS_LOGOS,
  MAP_OFFICE,
  REVIEWS,
  SOCIAL_ICON,
} from "../assets";
import { Cursor, Framed, PillLink, Slide, SlideHead } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  // --- О Qmedia ---
  aboutRow: { flexDirection: "row", marginTop: 10 },
  aboutLeft: { width: 258, paddingRight: 20 },
  aboutRight: { flex: 1 },
  factValue: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  factValueText: { fontSize: 12.5, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  factText: { fontSize: 10, lineHeight: 1.4, marginTop: 6, marginBottom: 20 },
  awardRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  award: { width: 118, height: 167 },
  aboutBottom: { flexDirection: "row", gap: 20, alignItems: "center" },
  clients: { width: 220, height: 93, objectFit: "contain" },
  linkList: { flex: 1 },
  siteLink: {
    fontSize: 10.5,
    color: DECK.ink,
    textDecoration: "underline",
    marginBottom: 8,
  },

  // --- Отзывы ---
  reviewTop: { flexDirection: "row", alignItems: "flex-start", marginTop: 8 },
  reviewLead: { width: 350, fontSize: 11, lineHeight: 1.45, paddingRight: 20 },
  reviewCta: { flexDirection: "row", alignItems: "flex-end", marginTop: 2 },
  reviewRow: { flexDirection: "row", gap: 12, marginTop: 40 },
  review: { flex: 1, height: 178 },

  // --- Кейсы ---
  caseHead: { flexDirection: "row", alignItems: "flex-start" },
  caseHeadLeft: { flex: 1 },
  caseCta: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
  caseRow: { flexDirection: "row", gap: 16, marginTop: 16 },
  caseCell: { flex: 1 },
  caseCover: { width: "100%", height: 118, marginBottom: 14 },
  caseTitle: { fontSize: 10.5, fontWeight: 700, lineHeight: 1.35, marginBottom: 14, flexGrow: 1 },

  // --- Контакты ---
  // Вертикаль блока выровнена по макету: контент и карта начинаются на одной
  // высоте и вместе доходят почти до подвала.
  contactRow: { flexDirection: "row", marginTop: 52 },
  contactLeft: { flex: 1, paddingRight: 24 },
  plate: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 5,
    marginBottom: 18,
  },
  plateText: { fontSize: 12, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  socialRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  socialIcon: { width: 26, height: 26, marginRight: 12, objectFit: "contain" },
  phone: { fontSize: 12.5, color: DECK.ink, textDecoration: "none", marginLeft: 8 },
  email: {
    fontSize: 22,
    fontWeight: 700,
    color: DECK.ink,
    textDecoration: "none",
    marginBottom: 28,
  },
  address: { fontSize: 11.5, lineHeight: 1.4 },
  map: { width: 330, height: 196 },
});

/** Макет 33 — цифры о компании, награды, клиенты и разделы сайта. */
export function AboutSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_ABOUT.title} size={26} />
      <View style={s.aboutRow}>
        <View style={s.aboutLeft}>
          {PITCH_ABOUT.facts.map((f) => (
            <View key={f.value}>
              <View style={[s.factValue, platePadding(12.5, 4.5)]}>
                <Text style={s.factValueText}>{f.value}</Text>
              </View>
              <Text style={s.factText}>{clean(f.text)}</Text>
            </View>
          ))}
        </View>

        <View style={s.aboutRight}>
          <View style={s.awardRow}>
            {AWARD.map((src) => (
              <Framed key={src} src={src} style={s.award} />
            ))}
          </View>
          <View style={s.aboutBottom}>
            <Image src={CLIENTS_LOGOS} style={s.clients} />
            <View style={s.linkList}>
              <Link src={LINKS.clients} style={s.siteLink}>
                Наши клиенты
              </Link>
              <Link src={LINKS.reviews} style={s.siteLink}>
                Отзывы о нашей работе
              </Link>
              <Link src={LINKS.awards} style={s.siteLink}>
                Награды и сертификаты
              </Link>
              <Link src={LINKS.cases} style={s.siteLink}>
                Маркетинговые кейсы
              </Link>
            </View>
          </View>
        </View>
      </View>
    </Slide>
  );
}

/** Макет 34 — благодарственные письма клиентов. */
export function ReviewsSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_REVIEWS.title} size={25} />
      <View style={s.reviewTop}>
        <Text style={s.reviewLead}>{clean(PITCH_REVIEWS.lead)}</Text>
        <View style={s.reviewCta}>
          <PillLink href={LINKS.reviews} size={12}>
            {PITCH_REVIEWS.buttonLabel}
          </PillLink>
          <Cursor size={30} style={{ marginLeft: -8, marginBottom: -14 }} />
        </View>
      </View>
      <View style={s.reviewRow}>
        {REVIEWS.map((src) => (
          <Framed key={src} src={src} style={s.review} />
        ))}
      </View>
    </Slide>
  );
}

/** Макет 35 — витрина кейсов со ссылками на сайт. */
export function CasesSlide() {
  return (
    <Slide>
      <View style={s.caseHead}>
        <View style={s.caseHeadLeft}>
          <SlideHead
            title={PITCH_CASES.title}
            subtitle={PITCH_CASES.subtitle}
            size={42}
            subSize={18}
          />
        </View>
        <View style={s.caseCta}>
          <PillLink href={LINKS.cases} size={11}>
            {PITCH_CASES.moreLabel}
          </PillLink>
          <Cursor size={28} style={{ marginLeft: -8, marginBottom: -13 }} />
        </View>
      </View>
      <View style={s.caseRow}>
        {PITCH_CASES.items.map((c) => (
          <View key={c.title} style={s.caseCell}>
            <Link src={c.url}>
              <Framed
                src={CASE_COVER[c.cover as keyof typeof CASE_COVER]}
                style={s.caseCover}
              />
            </Link>
            <Text style={s.caseTitle}>{clean(c.title)}</Text>
            <PillLink href={c.url} size={10} ghost style={{ paddingHorizontal: 26 }}>
              {PITCH_CASES.buttonLabel}
            </PillLink>
          </View>
        ))}
      </View>
    </Slide>
  );
}

/** Макет 36 — контакты: мессенджеры, почта, адрес и карта офиса. */
export function ContactsSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_CONTACTS.title} size={26} />
      <View style={s.contactRow}>
        <View style={s.contactLeft}>
          <View style={[s.plate, platePadding(12, 4.5)]}>
            <Text style={s.plateText}>{PITCH_CONTACTS.callTitle}</Text>
          </View>
          <View style={s.socialRow}>
            {SOCIALS.map((soc) => (
              <Link key={soc.key} src={soc.url}>
                <Image
                  src={SOCIAL_ICON[soc.key as keyof typeof SOCIAL_ICON]}
                  style={s.socialIcon}
                />
              </Link>
            ))}
            <Link src={COMPANY.phoneHref} style={s.phone}>
              {COMPANY.phone}
            </Link>
          </View>
          <Link src={`mailto:${COMPANY.email}`} style={s.email}>
            {COMPANY.email}
          </Link>
          <View style={[s.plate, platePadding(12, 4.5)]}>
            <Text style={s.plateText}>{PITCH_CONTACTS.officeTitle}</Text>
          </View>
          <Text style={s.address}>
            <Text style={{ fontWeight: 700 }}>{PITCH_CONTACTS.addressLabel} </Text>
            {COMPANY.address}
          </Text>
        </View>

        <Framed src={MAP_OFFICE} style={s.map} />
      </View>
    </Slide>
  );
}
