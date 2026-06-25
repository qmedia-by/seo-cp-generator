# CLAUDE.md

Заметки для будущих сессий по проекту **«Генератор КП по SEO — Qmedia»**.
Подробности для людей — в [README.md](README.md). Здесь — карта кода, доменная логика и
неочевидные грабли, на которые уже наступили.

## Что это

Внутренний инструмент Qmedia: по параметрам проекта считает стоимость SEO по 5 направлениям,
генерирует **PDF** (КП для клиента) и **Excel** (план + расчёт), сохраняет каждую генерацию
JSON-файлом, умеет импортировать JSON и пересчитывать.

Стек: **Next.js 14 (App Router) + TypeScript + Tailwind**, `@react-pdf/renderer` (PDF),
`exceljs` (Excel), `zod` (валидация), `vitest` (тесты), **Postgres** (Neon/Supabase) через `pg`.

## Команды

```bash
npm run dev     # dev (порт 3000, при занятости — 3001 и т.д.); нужен DATABASE_URL в .env.local
npm run build   # прод-сборка (заодно полная проверка типов)
npm test        # юнит-тесты расчёта (БД не требуется — calc чистый)
npx tsc --noEmit
```

Хранилищу нужен Postgres: задать `DATABASE_URL` в `.env.local` (шаблон — `.env.example`).
Локально проще всего через `Makefile` (поднимает Postgres в Docker + dev-сервер):

```bash
make init      # зависимости + .env.local + контейнер Postgres (seocp-pg)
make dev       # dev-сервер в foreground; make start — фоном; make stop/restart/status/logs
```

`make start` запускает `npm run dev` фоном с `nohup`, PID — в `.dev-server.pid` (gitignored),
логи — `.dev-server.log`; `stop-dev` гасит дерево процессов по PID (через рекурсивный `pgrep`),
`db-stop` делает `docker stop` (данные в томе `seocp-pgdata` сохраняются). Без Docker — обычный
`docker run ... postgres:16-alpine` и ручной `DATABASE_URL`.

## Карта кода

- `lib/seo-config.ts` — **единственный источник** ставок и коэффициентов (выверено по
  `sources/Расчет SEO.xlsx`). Тут же списки опций для форм.
- `lib/calc.ts` — чистая функция `calculate(input, directions)`. Логика 1:1 с Excel.
- `lib/works-catalog.ts` — 5 направлений и их работы (из `sources/Разбивка SEO по блокам работ.md`).
- `lib/company.ts` — фирстиль Qmedia: цвета (`BRAND`, **green-forward**), ассеты (`BRAND_ASSETS`),
  фото (`PHOTOS`), контакты/факты (`COMPANY`), преимущества.
- `lib/storage.ts` — хранилище КП в Postgres (таблица `proposals(id, created_at, data jsonb)`).
  Сигнатуры `buildProposal/saveProposal/getProposal/deleteProposal/listProposals` те же, что
  были у прежнего файлового варианта — роуты не менялись.
- `lib/db.ts` — singleton-пул `pg` по `DATABASE_URL` (Neon/Supabase) + ленивое
  `ensureSchema()` (идемпотентный `CREATE TABLE IF NOT EXISTS`). SSL включается автоматически
  для удалённых хостов, для `localhost` выключен.
- `lib/pdf/ProposalPdf.tsx` — PDF-документ (A4 landscape) по референсу `sources/cp-development.pdf`:
  обложка (фото + зелёный оверлей + белый логотип + Q-watermark), `HeaderBand` (зелёный градиент-
  колонтитул с Q-watermark, `fixed`), слайды «Смета» → «Направления» → «О Qmedia», подвал.
- `lib/xlsx/buildWorkbook.ts` — Excel (листы «Расчёт» и «План работ»). Зелёные шапки/секции,
  жёлтый — только акцент на итоговой строке.
- `app/api/proposals/...` — route handlers (CRUD, import, pdf, xlsx). Все: `runtime="nodejs"`,
  `dynamic="force-dynamic"`.
- `components/` — визард (`Wizard`, `StepProject`, `StepDirections`, `StepReview`, `CostPanel`)
  и `ProposalList`.
- `__tests__/calc.test.ts` — **золотой тест** (см. ниже).

## Доменная логика (расчёт)

- База `750`, час `75` BYN. Цена направления/мес = `750 × коэф.направления × Π(применимые коэф.)`,
  округление до целого; часы = `round(цена / 75)`.
- Наборы коэффициентов **различаются** по направлениям (см. `DIRECTION_COEFFICIENTS`):
  Коммерческое/GEO — все; Информационное/SERM — без страниц/ошибок/конкуренции;
  Техподдержка — только страницы/ошибки/опыт.
- Итог/мес = сумма включённых; итог за проект = месячный × срок (3/6).
- **Пакетная скидка** (`COMMERCIAL_BUNDLE` в `seo-config.ts`): если включено **Коммерческое
  SEO**, то включённые **GEO и SERM** считаются со скидкой **30%** (`monthlyPrice` =
  `round(fullMonthlyPrice × 0.7)`; часы — от цены со скидкой). В `DirectionCalc` есть
  `fullMonthlyPrice`/`discountRate`, в `CalcResult` — `monthlyTotalFullPrice`/`monthlyDiscount`.
  Скидку показываем всюду: CostPanel, StepReview, PDF (смета + детально + карточка стоимости),
  Excel (колонки «Полная цена/мес» и «Скидка/мес»). Нет в исходном Excel — это бизнес-правило.
- **Золотой тест** (значения из кэша Excel — это **полные** цены до скидок): Вся РБ, b2b, до 1000,
  Единичные, Сайт продвигался, Базово, Средняя → `1525/1155/1307/825/540`, сумма полных
  **5352 BYN**. С пакетной скидкой (Коммерческое включено) GEO→`915`, SERM→`578`, итог/мес =
  **4713 BYN / 62 ч**, скидка **639 BYN**. Любая правка расчёта обязана оставлять `npm test` зелёным.

## Принятые решения и допущения

- Валюта **BYN**. Срок: расчёт Excel = стоимость за месяц, итог = месяц × срок.
- «Ссылочное продвижение» и «Конкуренция» — поля формы (есть в Excel, не было в ТЗ).
- «Что продвигаем» **не влияет** на цену (нет коэффициента) — только текст в КП.
- «до 500» страниц в Excel **отсутствует** → коэффициент `1.1` (допущение, правится в config).
- Авторизации нет (MVP, внутренний инструмент).

## Грабли и уроки (важно!)

- **`@react-pdf/renderer` + Next: динамические узлы (`render`-проп) не выводятся.** Номера
  страниц через `render={({pageNumber})=>...}` не рендерятся (молча, ничего не видно).
  Поэтому подвал статический. Подробности и путь к фиксу — в памяти проекта
  `react-pdf-dynamic-nodes-next.md`. Не чинить позиционированием — дело не в нём.
- **Шрифт PDF.** Используется PT Sans (`public/fonts/QmediaSans-*.ttf`, OFL, с кириллицей),
  регистрируется в `ProposalPdf.tsx`. У него **нет** глифа `→` — заменять на тире через
  хелпер `clean()`. Курсив (`fontStyle: "italic"`) **не синтезируется** — без отдельного
  italic-файла будет ошибка «Could not resolve font». Системный Arial есть, но проприетарный —
  не коммитить.
- **react-pdf: крупный `fontSize` + унаследованный `lineHeight` 1.4 → текст налезает на
  соседний.** Для больших чисел/заголовков ставить `lineHeight: 1` + `marginBottom`.
- **Абсолютный элемент только с `right` схлопывает ширину** (текст не виден). Задавать
  `left` + `right` + `textAlign`.
- **🛑 react-pdf ВЕШАЕТ раскладку (синхронный бесконечный цикл), если абсолютная `<Image>`
  с отрицательным смещением / выходящая за край лежит прямо в `<Page>`.** Симптом: рендер
  висит вечно, vitest не показывает даже таймаута теста (event loop заблокирован). Лечение:
  оборачивать такие watermark-картинки в контейнер с `overflow:"hidden"` (см. обложку и
  колонтитул `HeaderBand` в `ProposalPdf.tsx`). Диагностика — бисекция через esbuild-бандл
  + `execFileSync(..., {timeout})` (vitest тут бесполезен — воркер виснет молча).
- **`Buffer` → `Response`.** TS ругается на `BodyInit`; оборачивать в `new Uint8Array(buffer)`.
- **Бутстрап.** Папка не пустая (`sources/`) — `create-next-app` откажется; проект собран
  конфигами вручную.
- **Хранилище — Postgres, не файлы.** Раньше КП лежали в `data/proposals/*.json`; на serverless
  (Vercel) ФС эфемерна и данные терялись бы. Теперь — таблица `proposals` в Postgres
  (Neon/Supabase), `data jsonb`. На Vercel в `DATABASE_URL` класть **pooled/pooler** строку
  подключения (иначе можно упереться в лимит коннектов). Колонка `id` — `text` (id всегда из
  `crypto.randomUUID`), чтобы не ловить ошибки каста `uuid` на «мусорных» id.
- Тяжёлые пакеты (`@react-pdf/renderer`, `exceljs`) вынесены во внешние через
  `serverComponentsExternalPackages` в `next.config.mjs`.

## Конвенции

- **Бренд green-forward.** Основной цвет — зелёный `#53BD35`, акцент — жёлтый `#FFDE00`
  (сверены с CSS qmedia.by). Чёрный почти не используется (только тёмный текст). Палитра
  в `BRAND` (`lib/company.ts`) и `tailwind.config.ts` зеркальны. Логотипы — `public/brand/logo-*.svg`
  (в вебе SVG; в PDF — белые PNG, т.к. react-pdf не грузит SVG через `<Image>`).
- **Общение с пользователем — только на русском** (техн. идентификаторы как есть).
- Литералы значений в типах/конфиге совпадают со значениями Excel — чтобы выгрузка и расчёт
  были зеркальны исходнику. Не переименовывать без необходимости.
