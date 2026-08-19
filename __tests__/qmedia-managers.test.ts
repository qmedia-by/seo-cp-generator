import { describe, it, expect } from "vitest";
import {
  formatQmediaPhone,
  hasChanges,
  mergeManagersFromSite,
  normalizeName,
  parseQmediaManagers,
} from "../lib/qmedia-managers";
import { photoVersion, type ManagerPhoto } from "../lib/manager-photos";
import type { Manager } from "../lib/types";

/**
 * Фрагмент реальной страницы https://www.qmedia.by/kontakty.html (август 2026),
 * урезанный до четырёх карточек — со всеми встреченными вариантами:
 *   1) два телефона + мессенджеры + email;
 *   2) телефон в формате «+375 (44)» и номер без дефисов;
 *   3) карточка без мессенджеров и без фото;
 *   4) имя с висящим пробелом и один телефон.
 * Вокруг — «шум» страницы с телефоном и mailto офиса: он не должен попасть в разбор.
 */
const PAGE = `
<footer>
  <a class="phone-link" href="tel:+375173352323">офис</a>
  <a href="mailto:info@qmedia.by">info@qmedia.by</a>
</footer>
<ul class="contact__list row">
  <li class="contact__list-point col-sm-6 col-lg-4">
    <div class="contact-manager" data-profile="Sales Manager">
      <a href="andrej_zhuk.html"><img class="contact-manager__avatar" src="a.png" alt="Андрей Жук" /></a>
      <div class="contact-manager__body">
        <a href="andrej_zhuk.html"><div class="contact-manager__title">Андрей Жук</div></a>
        <ul class="contact-manager__list">
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375293352323" title="Набрать номер">
              <span class="phone-link__code">+375 29</span>
              <span class="phone-link__number">335-23-23</span>
            </a>
          </li>
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375291352323" title="Набрать номер">
              <span class="phone-link__code">+375 29</span>
              <span class="phone-link__number">135-23-23</span>
            </a>
          </li>
          <li class="contact-manager__list-point">
            <div class="contact-manager__messengers messengers">
              <ul class="messengers__list">
                <li class="messengers__list-point d-block">
                  <a class="messenger-link" href="https://telegram.me/Andrey_Qmedia" target="_blank">Telegram</a>
                </li>
                <li class="messengers__list-point d-block">
                  <a class="messenger-link" href="viber://chat?number=+375299999999" target="_blank">Viber</a>
                </li>
                <li class="messengers__list-point d-block">
                  <a class="messenger-link" href="whatsapp://send?phone=+375299999999" target="_blank">WhatsApp</a>
                </li>
              </ul>
            </div>
          </li>
          <li class="contact-manager__list-point"><a href="mailto:andrey@qmedia.by">andrey@qmedia.by</a></li>
        </ul>
      </div>
    </div>
  </li><li class="contact__list-point col-sm-6 col-lg-4">
    <div class="contact-manager" data-profile="IT account-менеджер">
      <a href="darya_papovich.html"><img class="contact-manager__avatar" src="assets/cache/images/personal/darya_mini%281%29-180x-d13.png" width="98" height="98" alt="Дарья Папович" /></a>
      <div class="contact-manager__body">
        <a href="darya_papovich.html"><div class="contact-manager__title">Дарья Папович</div></a>
        <ul class="contact-manager__list">
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375293352323"><span class="phone-link__code">+375 29</span><span class="phone-link__number">335-23-23</span></a>
          </li>
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375447073315"><span class="phone-link__code">+375 (44)</span><span class="phone-link__number">7073315</span></a>
          </li>
          <li class="contact-manager__list-point"><a href="mailto:darya@qmedia.by">darya@qmedia.by</a></li>
        </ul>
      </div>
    </div>
  </li><li class="contact__list-point col-sm-6 col-lg-4">
    <div class="contact-manager" data-profile="Project менеджер (web-разработка)">
      <div class="contact-manager__body">
        <a href="evgenij_lashhevskij.html"><div class="contact-manager__title">Евгений Лащевский</div></a>
        <ul class="contact-manager__list">
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375296352323"><span class="phone-link__code">+375 (29)</span><span class="phone-link__number">6352323</span></a>
          </li>
          <li class="contact-manager__list-point"><a href="mailto:evg.qm@qmedia.by">evg.qm@qmedia.by</a></li>
        </ul>
      </div>
    </div>
  </li><li class="contact__list-point col-sm-6 col-lg-4">
    <div class="contact-manager" data-profile="Директор">
      <div class="contact-manager__body">
        <a href="valerij_grinko.html"><div class="contact-manager__title">Валерий Гринько </div></a>
        <ul class="contact-manager__list">
          <li class="contact-manager__list-point">
            <a class="phone-link" href="tel:+375298887766"><span class="phone-link__code">+375 29</span><span class="phone-link__number">888-77-66</span></a>
          </li>
          <li class="contact-manager__list-point"><a href="mailto:valera@qmedia.by">valera@qmedia.by</a></li>
        </ul>
      </div>
    </div>
  </li>
</ul>
<div class="other">
  <a class="phone-link" href="tel:+375170000000">не менеджер</a>
</div>
`;

/** Две разные «картинки»: содержимое не важно, важен разный отпечаток. */
const PHOTO_A: ManagerPhoto = { mime: "image/png", base64: "aGVsbG8=" };
const PHOTO_B: ManagerPhoto = { mime: "image/jpeg", base64: "d29ybGQ=" };

describe("parseQmediaManagers", () => {
  const parsed = parseQmediaManagers(PAGE);

  it("находит всех менеджеров блока и только их", () => {
    expect(parsed.map((m) => m.name)).toEqual([
      "Андрей Жук",
      "Дарья Папович",
      "Евгений Лащевский",
      "Валерий Гринько",
    ]);
  });

  it("берёт последний телефон карточки (первый — общий офисный)", () => {
    expect(parsed[0].phone).toBe("+375 (29) 135-23-23");
    expect(parsed[1].phone).toBe("+375 (44) 707-33-15");
  });

  it("не путает номера мессенджеров с телефоном", () => {
    expect(parsed[0].phone).not.toContain("999-99-99");
  });

  it("вытаскивает email", () => {
    expect(parsed.map((m) => m.email)).toEqual([
      "andrey@qmedia.by",
      "darya@qmedia.by",
      "evg.qm@qmedia.by",
      "valera@qmedia.by",
    ]);
  });

  it("берёт должность из data-profile", () => {
    expect(parsed.map((m) => m.role)).toEqual([
      "Sales Manager",
      "IT account-менеджер",
      "Project менеджер (web-разработка)",
      "Директор",
    ]);
  });

  it("карточка без data-profile не ломает разбор", () => {
    const noAttr = PAGE.replace(/ data-profile="[^"]*"/g, "");
    const managers = parseQmediaManagers(noAttr);
    expect(managers).toHaveLength(4);
    expect(managers.every((m) => m.role === "")).toBe(true);
  });

  it("разворачивает адрес фото в абсолютный", () => {
    expect(parsed.map((m) => m.photoUrl)).toEqual([
      "https://www.qmedia.by/a.png",
      "https://www.qmedia.by/assets/cache/images/personal/darya_mini%281%29-180x-d13.png",
      "",
      "",
    ]);
  });

  it("берёт ссылку на резюме из адреса вокруг аватарки", () => {
    expect(parsed.map((m) => m.resumeUrl)).toEqual([
      "https://www.qmedia.by/andrej_zhuk.html",
      "https://www.qmedia.by/darya_papovich.html",
      "",
      "",
    ]);
  });

  it("карточка без фото не ломает разбор", () => {
    expect(parsed[2].name).toBe("Евгений Лащевский");
    expect(parsed[2].photoUrl).toBe("");
  });

  it("возвращает пустой список, если блока нет (вёрстка поменялась)", () => {
    expect(parseQmediaManagers("<html><body>нет блока</body></html>")).toEqual([]);
  });
});

describe("formatQmediaPhone", () => {
  it("приводит белорусские номера к формату проекта", () => {
    expect(formatQmediaPhone("+375291352323")).toBe("+375 (29) 135-23-23");
    expect(formatQmediaPhone("375 (44) 707-33-15")).toBe("+375 (44) 707-33-15");
  });

  it("чужой формат оставляет как есть", () => {
    expect(formatQmediaPhone("+7 495 123-45-67")).toBe("+7 495 123-45-67");
  });
});

describe("normalizeName", () => {
  it("не различает регистр, лишние пробелы и ё/е", () => {
    expect(normalizeName("  Пётр   Семёнов ")).toBe(normalizeName("петр семенов"));
  });
});

describe("mergeManagersFromSite", () => {
  const current: Manager[] = [
    {
      id: "a",
      name: "Андрей Жук",
      role: "IT account-менеджер Qmedia",
      phone: "+375 (29) 000-00-00",
      email: "andrey@qmedia.by",
      resumeUrl: "",
    },
    {
      id: "b",
      name: "Дарья Папович",
      role: "IT account-менеджер",
      phone: "+375 (44) 707-33-15",
      email: "darya@qmedia.by",
      resumeUrl: "https://www.qmedia.by/darya_papovich.html",
    },
    {
      id: "c",
      name: "Уволенный Сотрудник",
      role: "",
      phone: "",
      email: "old@qmedia.by",
      resumeUrl: "",
    },
  ];

  const site = parseQmediaManagers(PAGE);
  let n = 0;
  const plan = mergeManagersFromSite(current, site, { newId: () => `new${++n}` });

  it("состав — как на сайте, порядок — по алфавиту", () => {
    expect(plan.managers.map((m) => m.name)).toEqual([
      "Андрей Жук",
      "Валерий Гринько",
      "Дарья Папович",
      "Евгений Лащевский",
    ]);
  });

  it("не зависит от порядка карточек на сайте (сайт их тасует)", () => {
    const shuffled = mergeManagersFromSite(current, [...site].reverse(), {
      newId: () => "x",
    });
    expect(shuffled.managers.map((m) => m.name)).toEqual(
      plan.managers.map((m) => m.name),
    );
    expect(shuffled.added).toEqual(plan.added);
  });

  it("обновляет контакты и должность, но сохраняет id", () => {
    const zhuk = plan.managers[0];
    expect(zhuk.id).toBe("a");
    expect(zhuk.role).toBe("Sales Manager");
    expect(zhuk.phone).toBe("+375 (29) 135-23-23");
    expect(plan.updated).toEqual(["Андрей Жук"]);
  });

  it("совпавших не считает изменёнными", () => {
    expect(plan.unchanged).toEqual(["Дарья Папович"]);
  });

  it("добавляет новых вместе с должностью", () => {
    expect(plan.added).toEqual(["Валерий Гринько", "Евгений Лащевский"]);
    expect(plan.managers[3]).toEqual({
      id: "new1",
      name: "Евгений Лащевский",
      role: "Project менеджер (web-разработка)",
      phone: "+375 (29) 635-23-23",
      email: "evg.qm@qmedia.by",
      resumeUrl: "",
    });
  });

  it("удаляет тех, кого на сайте нет", () => {
    expect(plan.removed).toEqual(["Уволенный Сотрудник"]);
  });

  it("пустое значение с сайта не затирает заполненное у нас", () => {
    const kept = mergeManagersFromSite(
      [
        {
          id: "a",
          name: "Андрей Жук",
          role: "Директор",
          phone: "+375 (29) 111-11-11",
          email: "a@b.by",
          resumeUrl: "https://www.qmedia.by/andrej_zhuk.html",
        },
      ],
      [
        {
          name: "Андрей Жук",
          role: "",
          phone: "",
          email: "",
          photoUrl: "",
          resumeUrl: "",
        },
      ],
    );
    expect(kept.managers[0].role).toBe("Директор");
    expect(kept.managers[0].phone).toBe("+375 (29) 111-11-11");
    expect(kept.managers[0].email).toBe("a@b.by");
    expect(kept.managers[0].resumeUrl).toBe(
      "https://www.qmedia.by/andrej_zhuk.html",
    );
    expect(kept.unchanged).toEqual(["Андрей Жук"]);
  });

  it("новому менеджеру кладёт скачанное фото", () => {
    const withPhotos = mergeManagersFromSite(current, site, {
      newId: () => "new",
      photos: new Map([["https://www.qmedia.by/a.png", PHOTO_A]]),
    });
    const zhuk = withPhotos.managers.find((m) => m.name === "Андрей Жук")!;
    expect(zhuk.photoVersion).toBe(photoVersion(PHOTO_A));
    expect(withPhotos.photos).toEqual([{ managerId: "a", photo: PHOTO_A }]);
    expect(withPhotos.photosChanged).toEqual(["Андрей Жук"]);
  });

  it("сообщает, когда применять нечего", () => {
    const same = mergeManagersFromSite(
      [
        {
          id: "a",
          name: "Андрей Жук",
          role: "",
          phone: "+375 (29) 1",
          email: "a@b.by",
          resumeUrl: "",
        },
      ],
      [
        {
          name: "Андрей Жук",
          role: "",
          phone: "+375 (29) 1",
          email: "a@b.by",
          photoUrl: "",
          resumeUrl: "",
        },
      ],
    );
    expect(hasChanges(same)).toBe(false);
    expect(hasChanges(plan)).toBe(true);
  });
});

/**
 * Фото: сравниваем по отпечатку скачанного файла, а не по адресу — на сайте
 * картинку могут заменить, не меняя имени файла.
 */
describe("mergeManagersFromSite: фото", () => {
  const URL_A = "https://www.qmedia.by/a.png";
  const siteOne = [
    {
      name: "Андрей Жук",
      role: "Директор",
      phone: "+375 (29) 111-11-11",
      email: "a@b.by",
      photoUrl: URL_A,
      resumeUrl: "",
    },
  ];
  const currentOne = (photoVersionValue?: string): Manager[] => [
    {
      id: "a",
      name: "Андрей Жук",
      role: "Директор",
      phone: "+375 (29) 111-11-11",
      email: "a@b.by",
      resumeUrl: "",
      ...(photoVersionValue ? { photoVersion: photoVersionValue } : {}),
    },
  ];

  it("то же самое фото не считается изменением", () => {
    const plan = mergeManagersFromSite(currentOne(photoVersion(PHOTO_A)), siteOne, {
      photos: new Map([[URL_A, PHOTO_A]]),
    });
    expect(plan.photos).toEqual([]);
    expect(plan.photosChanged).toEqual([]);
    expect(plan.unchanged).toEqual(["Андрей Жук"]);
    expect(hasChanges(plan)).toBe(false);
  });

  it("замена фото при прочих совпадающих данных — это изменение", () => {
    const plan = mergeManagersFromSite(currentOne(photoVersion(PHOTO_A)), siteOne, {
      photos: new Map([[URL_A, PHOTO_B]]),
    });
    expect(plan.photos).toEqual([{ managerId: "a", photo: PHOTO_B }]);
    expect(plan.photosChanged).toEqual(["Андрей Жук"]);
    // Иначе кнопки «Применить» в интерфейсе не будет и фото не обновится.
    expect(plan.updated).toEqual(["Андрей Жук"]);
    expect(hasChanges(plan)).toBe(true);
  });

  it("не скачалось — остаётся то фото, что было", () => {
    const plan = mergeManagersFromSite(currentOne("старая-версия"), siteOne, {
      photos: new Map(),
    });
    expect(plan.managers[0].photoVersion).toBe("старая-версия");
    expect(plan.photos).toEqual([]);
    expect(plan.unchanged).toEqual(["Андрей Жук"]);
  });
});
