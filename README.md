# PanaNames E2E

Інструкції запуску тестів Playwright для dev-середовища PanaNames. Усі команди виконуйте з кореня проєкту.

## Передумови

- Для локального запуску: Node.js 22 та npm.
- Для запуску в контейнері: Docker із Compose v2 і запущений Docker Engine. Локальні Node.js та браузери не потрібні.
- Доступ до `https://mcp.pananames-dev.com` і тестовий акаунт без CAPTCHA/2FA.
- Порожній кошик тестового акаунта перед доменними тестами. Не використовуйте цей акаунт одночасно в інших запусках або вручну.

## Налаштування середовища

Якщо `.env` ще немає, створіть його:

```bash
cp .env.example .env
```

Вкажіть адресу середовища та дані тестового акаунта:

```dotenv
BASE_URL=https://mcp.pananames-dev.com
TEST_USER_EMAIL=your-login
TEST_USER_PASSWORD=your-password
```

Не додавайте `.env` у Git. Авторизація під час звичайного запуску виконується автоматично.

## Локальний запуск

Встановіть залежності та Chromium:

```bash
npm ci
npx playwright install chromium
```

На Linux замість останньої команди виконайте:

```bash
npx playwright install --with-deps chromium
```

Перевірте налаштування та запустіть тести:

```bash
npm run typecheck
npm run test:list
npm test
```

Перед повним запуском переконайтеся, що в тестах немає `test.only` або `test.describe.only`: вони обмежують набір тестів, а в CI спричиняють помилку.

Окремі групи та запуск із видимим браузером:

```bash
npm test -- tests/contacts
npm test -- tests/domains
npm run test:headed
```

Для інтерактивного режиму спочатку підготуйте сесію:

```bash
npx playwright test --project=setup
npm run test:ui
```

Якщо сесія прострочилася, повторіть команду setup.

Перегляд HTML-звіту після запуску:

```bash
npm run report
```

## Запуск у Docker

Спочатку налаштуйте `.env`, як описано вище, потім виконайте:

```bash
docker compose build
docker compose run --rm tests
```

Після зміни коду або залежностей повторіть `docker compose build`.

Для запуску окремої групи:

```bash
docker compose run --rm tests npm test -- tests/contacts
docker compose run --rm tests npm test -- tests/domains
```

Перегляд звіту:

```bash
docker compose --profile tools up --no-deps report
```

Відкрийте [HTML-звіт](http://localhost:9323). Для зупинки натисніть `Ctrl+C`.

## Запуск у GitHub Actions

У репозиторії відкрийте **Settings → Secrets and variables → Actions** і додайте repository secrets:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Запустіть **Actions → PanaNames E2E → Run workflow**. Тести також запускаються автоматично після push у `main`. Для іншого середовища змініть `BASE_URL` у `.github/workflows/e2e.yml`.

Звіт доступний у розділі **Artifacts → playwright-report** відповідного запуску.

## Результати запуску

- `playwright-report/` — HTML-звіт.
- `test-results/` — screenshots і traces невдалих тестів.

Ці папки зберігаються локально і при запуску через Docker. Звіти можуть містити дані акаунта та сесії — не публікуйте їх.
