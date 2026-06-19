# Как правильно дебажить Playwright-тесты: современный гайд (2025–2026)

> Актуально для Playwright **1.60 / 1.61** (стабильная линейка на июнь 2026).
> Все факты сверены с официальной документацией playwright.dev и release notes; версии, в которых появились фичи, указаны там, где это подтверждено.

---

## Оглавление

1. [Главный принцип: меньше дебага — больше детерминизма](#1-главный-принцип)
2. [Trace Viewer — инструмент №1 для разбора падений](#2-trace-viewer)
3. [UI Mode — интерактивная отладка с time-travel](#3-ui-mode)
4. [Playwright Inspector и CLI (`--debug`, `PWDEBUG`, `page.pause()`)](#4-inspector-и-cli)
5. [VS Code extension — live-дебаг прямо в редакторе](#5-vs-code-extension)
6. [Codegen — запись тестов и подбор локаторов](#6-codegen)
7. [Подробные логи: `DEBUG=pw:*`](#7-подробные-логи)
8. [Дебаг флаки-тестов: auto-waiting, web-first assertions, локаторы, retries](#8-флаки-тесты)
9. [Дебаг в CI (GitHub Actions) и Docker](#9-ci-и-docker)
10. [Новые фичи 2024–2026 (включая AI-дебаг)](#10-новинки)
11. [Чек-лист и сценарии](#11-чек-лист)
12. [Источники](#12-источники)

---

<a name="1-главный-принцип"></a>
## 1. Главный принцип: меньше дебага — больше детерминизма

Сквозная мысль официальной документации: **большая часть «багов в тестах» — это не баги, а флаки**, которые исчезают, если опираться на встроенные механизмы Playwright (авто-ожидание + web-first assertions + user-facing локаторы) и перестать вставлять ручные паузы. Дебаг-инструменты ниже нужны, чтобы быстро находить *причину*, а не чтобы латать симптомы.

Иерархия инструментов по ситуации:

| Ситуация | Инструмент |
|---|---|
| Тест упал в CI, локально не воспроизводится | **Trace Viewer** (`trace: 'on-first-retry'`) |
| Разбираю/пишу тест локально, хочу «перемотку» | **UI Mode** (`--ui`) |
| Нужно встать на точку и пошагать, поправить локатор | **Inspector** (`--debug` / `page.pause()`) |
| Пишу код и хочу брейкпоинты + переменные | **VS Code extension** |
| Непонятно, *почему* Playwright чего-то ждёт | **`DEBUG=pw:api`** + actionability-лог |
| Тест мигает (то падает, то нет) | раздел [флаки-тесты](#8-флаки-тесты) |

---

<a name="2-trace-viewer"></a>
## 2. Trace Viewer — инструмент №1 для разбора падений

Trace — это полная запись прогона теста: таймлайн действий, DOM-снапшоты до/после каждого шага, сеть, консоль, исходник, скриншоты-плёнка. Это **главный** способ дебажить падения, особенно в CI.

### Включение трейсов

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 1,
  use: {
    trace: 'on-first-retry', // запись трейса только при первой повторной попытке упавшего теста
  },
});
```

Режимы `trace`:

- `'off'` — выключено;
- `'on'` — каждый тест (тяжело по перформансу, **не рекомендуется**);
- `'retain-on-failure'` — пишет всегда, но сохраняет только у упавших;
- `'on-first-retry'` — только на первом ретрае (рекомендуется для CI);
- `'on-all-retries'` — на всех ретраях;
- `'retain-on-first-failure'` — только первый прогон, сохраняется при падении *(v1.43)*;
- `'retain-on-failure-and-retries'` — пишет все прогоны и сохраняет все трейсы при падении попытки; удобно сравнивать «зелёный» и «красный» трейс флаки-теста *(v1.59)*.

Разовая запись без правки конфига:

```bash
npx playwright test --trace on
```

### Открытие трейсов

```bash
npx playwright show-trace path/to/trace.zip            # локальный файл
npx playwright show-trace https://example.com/trace.zip # трейс по URL
```

Или без установки чего-либо — перетащить `trace.zip` на **https://trace.playwright.dev** (всё обрабатывается в браузере, данные никуда не уходят). Также трейс открывается из HTML-отчёта по иконке рядом с тестом.

### Что внутри трейса

Вкладки: **Actions** (локатор, длительность, лог каждого действия, состояние «до/после»), **Screenshots** (плёнка-скринкаст), **Snapshots** (полные DOM-снапшоты с перемоткой по таймлайну), **Network**, **Console**, **Source** (с кнопкой «Open in VSCode»), **Call/Log** (внутренний лог Playwright: скролл, ожидание visible/enabled/stable), **Metadata** и **Attachments** (включая визуальный diff для скриншот-тестов).

### Свежие возможности Trace Viewer

- **v1.51 — кнопка «Copy prompt»**: на ошибке в трейсе/отчёте/UI Mode копируется готовый промпт с контекстом ошибки для LLM — ключевая «AI-дебаг» фича.
- **v1.53** — вкладка **Steps**; метод `locator.describe()` для подписи локаторов в трейсе/отчёте.
- **v1.58** — тема `'system'`, поиск **Cmd/Ctrl+F** внутри редакторов кода, авто-форматирование JSON в панели сети.
- **v1.59 — `npx playwright trace` (CLI-анализ трейса)**: разбор трейса из терминала (удобно для AI-агентов):

  ```bash
  npx playwright trace open test-results/example-chromium/trace.zip
  npx playwright trace actions --grep="expect"
  npx playwright trace action 9
  npx playwright trace snapshot 9 --name after
  npx playwright trace close
  ```
- **v1.61** — в трейс/HAR теперь попадают **WebSocket**-запросы.

---

<a name="3-ui-mode"></a>
## 3. UI Mode — интерактивная отладка с time-travel

```bash
npx playwright test --ui                       # все тесты
npx playwright test tests/login.spec.ts --ui   # конкретный файл
npx playwright test --ui-host=0.0.0.0          # для Docker/Codespaces (с осторожностью!)
```

> ⚠️ `--ui-host=0.0.0.0` открывает трейсы, пароли и секреты другим машинам в сети.

Возможности:

- **Time-travel таймлайн** — наведение показывает снапшоты, двойной клик по действию выделяет его временной диапазон и фильтрует Console/Network.
- **Watch mode** — иконка «глаз» у теста (или сверху для всех) перезапускает при изменении файла.
- **Фильтры** — по имени, `@tag`, проекту из конфига и статусу (passed/failed/skipped).
- **Pop out & inspect DOM** — снапшот выносится в отдельное окно, можно открыть DevTools; два действия можно сравнить рядом.
- **Pick locator** — навёл на элемент → получил локатор → отредактировал и проверил совпадения в «песочнице» локатора → скопировал.
- **Errors tab** — список ошибок, красная отметка на таймлайне в точке падения, переход к строке исходника.

Новое: слияние файлов в один список и режим одного воркера *(v1.56)*; показ **только затронутых изменениями тестов** *(v1.59)*.

---

<a name="4-inspector-и-cli"></a>
## 4. Playwright Inspector и CLI

### `--debug`

```bash
npx playwright test --debug
```

Открывает **Inspector** и настраивает прогон для отладки: браузер в **headed**-режиме, **таймаут = 0** (не упадёт, пока вы стоите на точке), тесты идут **по одному**.

Точечный дебаг:

```bash
npx playwright test example.spec.ts:10 --debug          # один тест по номеру строки
npx playwright test --project=chromium --debug          # на конкретном браузере
npx playwright test example.spec.ts:10 --project=webkit --debug
```

### `PWDEBUG`

`PWDEBUG=1` — эквивалент `--debug` через переменную окружения (открывает Inspector, headed, без таймаута).

Возможности Inspector: пошаговое выполнение (текущее действие подсвечивается и в коде, и в браузере), **Resume** (до следующего `page.pause()`), **Pick Locator** (Playwright приоритезирует role/text/test-id и сам делает локатор уникальным), **live-редактирование локатора**, **actionability-лог** (visible? enabled? stable? отскроллен? — главный сигнал для зависших действий).

`PWDEBUG=console` добавляет в DevTools-консоль браузера объект `playwright`:

```bash
PWDEBUG=console npx playwright test
```
```js
playwright.$('.auth-form >> text=Log in');          // один элемент
playwright.$$('.list-item');                          // все совпадения
playwright.inspect('.auth-form');                     // показать в Elements
playwright.locator('.auth-form', { hasText: 'Log in' });
playwright.selector($0);                              // сгенерировать селектор для элемента из Elements
```

В PowerShell:
```powershell
$env:PWDEBUG="console"; npx playwright test
```

### `page.pause()`

```js
await page.pause();
```

Ставит брейкпоинт, открывает Inspector — можно резюмить, шагать, подбирать/править локаторы, исследовать DOM с этой точки. В debug-режиме клик **Resume** домотает ровно до `page.pause()`.

> Версия-нюанс: после v1.47 был регресс (issue #32706), когда `page.pause()` не приостанавливал таймаут *теста*. `--debug`/`PWDEBUG=1` (таймаут = 0) обходят эту проблему.

### Headed, slowMo, один воркер

```bash
npx playwright test --headed       # видимый браузер
npx playwright test --workers=1    # без параллелизма (последовательно)
```
```js
// slowMo — это launch-опция, не CLI-флаг
await chromium.launch({ headless: false, slowMo: 100 });
// в конфиге:
use: { launchOptions: { slowMo: 100 } }
```

### Выбор и перезапуск тестов

```bash
npx playwright test tests/todo.spec.ts        # файл
npx playwright test my-spec.ts:42             # по номеру строки
npx playwright test -g "add a todo item"      # по названию (grep)
npx playwright test --grep-invert "slow"      # инверсия
npx playwright test --project=chromium        # проект
npx playwright test --last-failed             # только упавшие в прошлый раз (v1.44)
npx playwright test --only-changed            # только изменённые в git файлы (v1.46)
npx playwright test --only-changed=main       # относительно ветки/рефа
```

---

<a name="5-vs-code-extension"></a>
## 5. VS Code extension — live-дебаг прямо в редакторе

Официальное расширение **«Playwright Test for VSCode»** (`ms-playwright.playwright`). На середину 2026 актуальна линейка **1.1.x** (v1.1.18 подтянула встроенный `@playwright/test` до 1.59; v1.1.16 от окт. 2025 убрала поддержку Playwright ≤1.43 — нужен проект на Playwright ≥1.44).

**`launch.json` не нужен** — расширение само управляет раннером и отладчиком.

### Базовый сценарий

1. Установить расширение → Command Palette → **«Test: Install Playwright»** (если Playwright ещё не в проекте).
2. Иконка **Testing** (колба) в Activity Bar → дерево тестов + сайдбар Playwright.
3. **Запуск одного теста** — зелёная стрелка в гаттере у `test()`; результат (✓/✗) и длительность показываются inline.
4. **Несколько браузеров** — отметить проекты-чекбоксы в сайдбаре.

### Live-дебаг

- **Брейкпоинты**: клик в гаттере (красная точка) → правый клик по тесту → **Debug Test**. Стандартный тулбар отладки VS Code, инспекция переменных.
- **Show Browser** (чекбокс) — видимый браузер, сессия переиспользуется.
- **Синхронизация редактор ↔ браузер**: при включённом Show Browser клик по локатору в коде подсвечивает элементы в живом браузере; правка локатора в редакторе обновляет подсветку **без перезапуска**.
- **Chrome DevTools**: вместо Debug Test — **Run Test** с Show Browser, и можно открыть DevTools для непрерывной отладки и теста, и приложения.

### Codegen внутри VS Code

- **Pick locator** — подбор локатора кликом (Enter — скопировать, Esc — отмена); чекбокс «Copy on pick» *(v1.1.14)*.
- **Record new** — запись нового теста.
- **Record at cursor** — вставка записанных действий в текущую позицию курсора; с v1.1.18 — даже во время активной debug-сессии.

### Watch, ошибки, трейсы

- **Watch mode** — иконка «глаз» у теста (или сверху для всех): автоперезапуск при сохранении.
- **Inline-ошибки** — ожидаемое/полученное + полный call log прямо в редакторе.
- **Show Trace Viewer** (чекбокс в сайдбаре) — после прогона автоматически открывается полный трейс.
- **Fix with AI** *(v1.1.14)* — иконка-«искра» у ошибки запускает предложение исправления от GitHub Copilot с контекстом ошибки.

---

<a name="6-codegen"></a>
## 6. Codegen — запись тестов и подбор локаторов

```bash
npx playwright codegen demo.playwright.dev/todomvc
```

Открывает браузер + Inspector, который записывает действия в готовый код. Через тулбар генерируются **ассерты**: `assert visibility`, `assert text`, `assert value`. После **Record** (стоп) доступна кнопка **Pick Locator**.

Полезные флаги:

```bash
npx playwright codegen --target=python-pytest playwright.dev   # язык/раннер
npx playwright codegen --viewport-size="800,600" playwright.dev
npx playwright codegen --device="iPhone 13" playwright.dev
npx playwright codegen --color-scheme=dark playwright.dev
npx playwright codegen --timezone="Europe/Rome" --geolocation="41.89,12.49" --lang="it-IT" bing.com/maps

# сохранить/переиспользовать состояние авторизации
npx playwright codegen github.com --save-storage=auth.json
npx playwright codegen --load-storage=auth.json github.com
```

> `auth.json` содержит куки/токены — добавьте в `.gitignore` или удаляйте после использования. С Chrome 136 нельзя автоматизировать *дефолтный* user-data-dir — создавайте отдельный.

---

<a name="7-подробные-логи"></a>
## 7. Подробные логи: `DEBUG=pw:*`

Playwright использует библиотеку `debug`, логи фильтруются переменной `DEBUG`:

- `pw:api` — высокоуровневые вызовы API; **лучшее** для понимания «почему ждёт/таймаутит» (это «золотая середина»);
- `pw:browser` — запуск/процесс браузера (диагностика «Failed to launch browser»);
- `pw:protocol` — низкоуровневый CDP-трафик (очень многословно).

```bash
# Bash / macOS / Linux
DEBUG=pw:api npx playwright test

# PowerShell
$env:DEBUG="pw:api"; npx playwright test

# Windows CMD
set DEBUG=pw:api && npx playwright test
```

Перенаправление в файл (логи идут в **stderr**):

```bash
DEBUG=pw:api npx playwright test 2> pw.log        # только логи
DEBUG=pw:api npx playwright test > out.log 2>&1    # логи + вывод тестов
```
```powershell
$env:DEBUG="pw:api"; npx playwright test *>&1 | Out-File pw.log
```

> Встроенного флага «лог в файл» в Playwright нет (запрос #29799 открыт) — используйте редирект шелла.

---

<a name="8-флаки-тесты"></a>
## 8. Дебаг флаки-тестов

### 8.1. Авто-ожидание (actionability)

Перед каждым действием Playwright автоматически ждёт выполнения набора проверок; если за `timeout` они не прошли — `TimeoutError`. Для `click()` проверяется, что локатор резолвится в **ровно один** элемент, и он **Visible**, **Stable** (анимация завершена), **Receives Events** (не перекрыт оверлеем) и **Enabled**. Полный набор состояний: Visible, Stable, Enabled, Editable, Receives Events — разные действия требуют разных подмножеств.

Именно это убирает гонки: спиннеры, поздний рендер, перекрытия, «кнопка-disabled-до-валидации» обрабатываются сами.

**Как дебажить зависшее действие**: в Inspector (`--debug`) и в Trace Viewer виден actionability-лог — «waiting for element to be visible, enabled and stable», какая именно проверка ещё `pending`. `{ force: true }` пропускает проверки (escape hatch, не рекомендуется).

### 8.2. Web-first assertions (авто-ретрай)

Матчеры на **локаторе** асинхронные и **сами повторяются** до успеха или до таймаута (по умолчанию **5 с**). Их обязательно нужно `await`.

```js
// 👍 повторяется, пока не появится / не станет нужный текст
await expect(page.getByTestId('status')).toHaveText('Submitted');
await expect(page.getByText('welcome')).toBeVisible();

// 👎 АНТИПАТТЕРН №1: снимок состояния, без ретрая → флаки
expect(await page.getByText('welcome').isVisible()).toBe(true);
```

Главная ошибка — `await` *внутри* `expect()`. Кастомный таймаут:

```js
await expect(locator).toHaveText('Submitted', { timeout: 10_000 });
// глобально:
export default defineConfig({ expect: { timeout: 10_000 } });
```

`expect.poll` (повтор произвольной функции, напр. API):

```js
await expect.poll(async () => (await page.request.get('/api/status')).status(), {
  timeout: 10_000,
  intervals: [1_000, 2_000, 5_000],
}).toBe(200);
```

`expect.toPass` (повтор блока ассертов; таймаут по умолчанию **0** — задавайте явно):

```js
await expect(async () => {
  const r = await page.request.get('/api/data');
  expect(r.status()).toBe(200);
}).toPass({ timeout: 15_000, intervals: [1_000, 2_000] });
```

`expect.soft` — мягкие ассерты: не останавливают тест, собираются к концу.

### 8.3. Retries

Выключены по умолчанию.

```bash
npx playwright test --retries=3
```
```js
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  use: { trace: 'on-first-retry' },
});
```

Упавший тест перезапускается в **свежем воркере и свежем браузере**. Категории: **passed**, **flaky** (упал, прошёл на ретрае), **failed**. В HTML-отчёте есть отдельный счётчик **flaky** — это сигнал «иди разбирайся», а не «всё ок». Ретраи *прячут* флаки, а не лечат.

Определить ретрай в рантайме / аннотации:

```js
test('my test', async ({ page }, testInfo) => {
  if (testInfo.retry) await resetServerState();
});
```
`test.fail()` (ожидаем падение), `test.fixme()` (известно сломан — пропустить), `test.slow()` (×3 к таймауту), `test.skip()`.

### 8.4. Локаторы (фундамент стабильности)

Приоритет (от устойчивого к ломкому):

1. `getByRole(role, { name })` — как видят пользователь/скринридер;
2. `getByLabel()` — поля форм;
3. `getByPlaceholder()`;
4. `getByText()`;
5. `getByAltText()` / `getByTitle()`;
6. `getByTestId()` — явный контракт `data-testid` (через `testIdAttribute`).

```js
await page.getByLabel('User Name').fill('John');
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page.getByText('Welcome, John!')).toBeVisible();
```

```js
// 👎 ломкие, привязаны к структуре DOM
page.locator('#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb input');
// 👍
page.getByRole('button', { name: 'submit' });
```

**Strict mode**: одиночное действие на локаторе, матчащем >1 элемента, бросает «strict mode violation» (в ошибке перечислены все совпадения). `.first()/.last()/.nth()` отключают строгость, но **нежелательны** — лучше делать локатор уникальным через chaining/filter.

```js
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });
await product.getByRole('button', { name: 'Add to cart' }).click();

page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Product 2' }) });
page.getByRole('listitem').filter({ hasNotText: 'Out of stock' });
page.locator('button').filter({ visible: true });
```

`or()` для непредсказуемого UI (иногда выскакивает диалог):

```js
const newEmail = page.getByRole('button', { name: 'New' });
const dialog = page.getByText('Confirm security settings');
await expect(newEmail.or(dialog).first()).toBeVisible();
if (await dialog.isVisible()) await page.getByRole('button', { name: 'Dismiss' }).click();
await newEmail.click();
```

### 8.5. Частые причины флаки и как чинить

**`waitForTimeout()` — антипаттерн.** «Никогда не ждите по таймеру в проде. Тесты, ждущие время, по сути флаки.» Заменяйте на ожидание реального условия:

```js
// 👎
await page.waitForTimeout(3000);
await page.getByRole('button', { name: 'Save' }).click();
// 👍
await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
await page.getByRole('button', { name: 'Save' }).click();
```

**`waitForLoadState('networkidle')` — не рекомендуется** (аналитика, websockets, long-polling, service workers могут никогда не дать «idle»). Ждите видимый индикатор готовности или конкретный ответ:

```js
// 👍
await page.goto('/dashboard');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
// 👍 или конкретный API
const resp = page.waitForResponse('**/api/dashboard');
await page.goto('/dashboard');
await resp;
```

Остальное: **анимации** — закрываются проверкой Stable, для скриншот-тестов `toHaveScreenshot()` отключает анимации сам; **изоляция** — каждый тест получает свежий `BrowserContext`/`Page`, не зависьте от порядка; **параллелизм** — флаки только в параллели обычно значит общее состояние бэкенда/портов/БД (изолируйте данные по `testInfo.workerIndex`, воспроизводите локально `--workers=4`); **внешние зависимости** — мокайте через `page.route(...).fulfill(...)`; включите ESLint-правило `@typescript-eslint/no-floating-promises` (пропущенный `await` — топ-причина флаки).

### 8.6. Инструменты обнаружения/воспроизведения

```bash
npx playwright test checkout.spec.ts --repeat-each=20   # прогнать N раз, выявить мигание
npx playwright test --workers=4                          # воспроизвести CI-контеншн
npx playwright test --fail-on-flaky-tests                # CI-гейт: ретрай = провал
```
Плюс `trace: 'on-first-retry'` + Trace Viewer, UI Mode (`--ui`), Inspector (`--debug`).

---

<a name="9-ci-и-docker"></a>
## 9. Дебаг в CI (GitHub Actions) и Docker

### 9.1. Сбор артефактов

```ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```
Артефакты складываются в `test-results/`, HTML-отчёт — в `playwright-report/`.

### 9.2. Загрузка и открытие трейсов в GitHub Actions

```yaml
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}   # отчёт грузится даже при падении тестов
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

Локально: скачать артефакт, распаковать и **обязательно** через сервер (просто `index.html` не откроется):

```bash
npx playwright show-report path/to/extracted-report
# или сам трейс:
npx playwright show-trace trace.zip
```
Либо перетащить `trace.zip` на https://trace.playwright.dev.

> ⚠️ Трейсы/логи/отчёты могут содержать токены и исходники — грузите только в доверенные хранилища.

### 9.3. Поведение при `CI=true`

GitHub Actions сам ставит `CI=true`, и Playwright меняет дефолты: репортёр **`dot`**; рекомендуется `forbidOnly: !!process.env.CI` (упасть, если закоммичен `test.only`); **`workers: process.env.CI ? 1 : undefined`** (стабильность важнее скорости — масштабируйтесь шардингом, а не воркерами); тесты идут **headless**. Браузеры ставятся `npx playwright install --with-deps`.

### 9.4. Шардинг + слияние blob-отчётов

```bash
npx playwright test --shard=1/4
npx playwright merge-reports --reporter html ./all-blob-reports
```
В конфиге: `reporter: process.env.CI ? 'blob' : 'html'`. С `fullyParallel: true` шардинг идёт на уровне отдельных тестов (равномерно). Матрица в GHA: job с `matrix: { shardIndex: [1,2,3,4], shardTotal: [4] }` (с `fail-fast: false`) грузит blob-артефакты, отдельный job `needs:` их скачивает (`download-artifact` с `pattern: blob-report-*`, `merge-multiple: true`) и сливает в единый HTML.

### 9.5. Docker

```bash
docker pull mcr.microsoft.com/playwright:v1.61.0-noble
docker run -it --rm --init --ipc=host mcr.microsoft.com/playwright:v1.61.0-noble /bin/bash
```
- **`--ipc=host`** — обязательно для Chromium: без него он упирается в 64 МБ shared memory и падает по OOM (выглядит как «флаки в CI»).
- **`--init`** — против зомби-процессов (PID 1).
- **Пиннинг версии критичен**: версия образа должна совпадать с `@playwright/test`, иначе Playwright не найдёт браузеры.
- Теги: `-noble` (Ubuntu 24.04), `-jammy` (22.04). **Alpine/musl не поддерживается.**
- Образ работает от `root` (sandbox Chromium выключен) — ок для доверенных E2E.

### 9.6. Дебаг «падает только в CI»

- **Трейсы — главный инструмент** (`trace: 'on-first-retry'` + retries): DOM-снапшоты, сеть, консоль и плёнка из точного упавшего прогона.
- **Headless vs headed**: у Chromium это два разных бинарника (headless shell в CI vs полный headed) — рендеринг/шрифты/GPU могут расходиться. Воспроизводите CI-падения, запуская **headless локально**, а не только headed.
- **Шрифты / locale / timezone** — тихий источник CI-only падений. Фиксируйте явно:
  ```ts
  use: { locale: 'en-GB', timezoneId: 'Europe/Paris', viewport: { width: 1280, height: 720 } }
  ```
- **Таймауты**: раннеры CI слабее ноутбука — лёгкий бамп `timeout`/`expect.timeout` уместен, но большие значения лишь *прячут* причину.
- **Запуск браузера**: `DEBUG=pw:browser npx playwright test` — диагностика «Failed to launch browser».
- **Headed на Linux** требует Xvfb (в образе и GHA уже есть): `xvfb-run npx playwright test`.

### 9.7. Новинки CI/репортинга 2024–2026

- **`github`-репортёр** — inline-аннотации падений прямо в UI GitHub Actions: `reporter: process.env.CI ? 'github' : 'list'` (но не с матрицей/шардингом — стектрейсы размножатся).
- **`--only-changed[=origin/$GITHUB_BASE_REF]`** *(v1.46)* — сначала прогнать тесты, затронутые изменениями (нужен `fetch-depth: 0`); затем полный прогон.
- **`--last-failed`** *(v1.44)* — только упавшие в прошлый раз.
- **`--fail-on-flaky-tests`** *(v1.44)* — exit 1, если кому-то понадобился ретрай.

---

<a name="10-новинки"></a>
## 10. Новые фичи 2024–2026 (кратко)

| Версия | Что добавили (про дебаг) |
|---|---|
| **1.43** | trace-режим `retain-on-first-failure` |
| **1.44** | CLI `--last-failed`, `--fail-on-flaky-tests` |
| **1.46** | `--only-changed`; аннотации в UI Mode |
| **1.47** | фильтры/превью в Network-вкладке трейса |
| **1.49** | `tracing.group()`; превью `<canvas>` в снапшотах |
| **1.51** | **«Copy prompt»** — промпт для LLM по ошибке (отчёт/трейс/UI Mode) |
| **1.53** | вкладка **Steps**; `locator.describe()` |
| **1.56** | UI Mode: слияние файлов, один воркер; кнопка отключения «Copy prompt» |
| **1.57** | **Speedboard** в HTML-отчёте (сортировка по медленным) |
| **1.58** | тема `system`, Cmd/Ctrl+F в редакторах, pretty-print JSON в сети |
| **1.59** | **`npx playwright trace`** (терминальный анализ для агентов); `retain-on-failure-and-retries`; live-трейсинг; в UI Mode только затронутые тесты |
| **1.60** | запись HAR через `context.tracing.startHar()` |
| **1.61** | WebSocket в HAR/trace |

Тренд: глубокая интеграция с **AI-дебагом** — «Copy prompt» на ошибках, «Fix with AI» (Copilot) в VS Code, терминальный `npx playwright trace` для агентов.

---

<a name="11-чек-лист"></a>
## 11. Чек-лист и сценарии

**Быстрый чек-лист стабильного теста:**

1. Доверяй авто-ожиданию — не пиши ручные паузы.
2. Всегда `await expect(locator).matcher()`; никогда `expect(await locator.isVisible())`.
3. Запрети `waitForTimeout` и `networkidle` — жди реальный UI/API-сигнал.
4. Локаторы: role/label/text/testId вместо CSS/XPath; держи их уникальными.
5. Тесты изолированы; воспроизводи флаки через `--repeat-each` и `--workers`.
6. Включи `trace: 'on-first-retry'` — и в CI всегда будет, что разбирать.

**Что делать по сценарию:**

- *«Упало в CI, локально не повторяется»* → скачать `playwright-report` → `show-report` → открыть трейс; запустить локально **headless**; проверить locale/timezone/шрифты и `--ipc=host`.
- *«Тест мигает»* → `--repeat-each=20`; смотреть actionability-лог в трейсе; убрать ручные waits; проверить изоляцию данных.
- *«Не пойму, почему ждёт/таймаутит»* → `DEBUG=pw:api` + actionability-лог в Inspector/Trace Viewer.
- *«Локатор не тот / strict mode violation»* → Pick Locator в Inspector/VS Code/UI Mode; chaining + `filter()`.
- *«Пишу/правлю тест»* → VS Code extension: брейкпоинты + Show Browser + watch; или `--ui`.

---

<a name="12-источники"></a>
## 12. Источники

Официальная документация Playwright:

- Debugging Tests — https://playwright.dev/docs/debug
- Trace Viewer — https://playwright.dev/docs/trace-viewer
- UI Mode — https://playwright.dev/docs/test-ui-mode
- Command line — https://playwright.dev/docs/test-cli
- Running & debugging tests — https://playwright.dev/docs/running-tests
- Codegen — https://playwright.dev/docs/codegen
- VS Code — https://playwright.dev/docs/getting-started-vscode
- Auto-waiting / Actionability — https://playwright.dev/docs/actionability
- Assertions — https://playwright.dev/docs/test-assertions
- Test retries — https://playwright.dev/docs/test-retries
- Best Practices — https://playwright.dev/docs/best-practices
- Locators — https://playwright.dev/docs/locators
- Reporters — https://playwright.dev/docs/test-reporters
- Sharding / merge-reports — https://playwright.dev/docs/test-sharding
- CI intro — https://playwright.dev/docs/ci-intro
- CI guide — https://playwright.dev/docs/ci
- Docker — https://playwright.dev/docs/docker
- Test use options (trace/screenshot/video, locale/timezone) — https://playwright.dev/docs/test-use-options
- Release notes (атрибуция версий) — https://playwright.dev/docs/release-notes
- VS Code extension (релизы) — https://github.com/microsoft/playwright-vscode/releases

Дополнительно: BrowserStack (Playwright Debugging), Checkly (waits & timeouts), TestDino (flaky tests), Currents.dev (headless vs headed), estruyf/playwright-github-actions-reporter.
