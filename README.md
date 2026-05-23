# Emigrant Croatia Desk (MVP)

Личный кабинет для цифровых кочевников в Хорватии.

## Стек

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL (RLS)
- Brevo — email при смене статуса дела

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env.local` на основе `.env.example`. Для облачного Supabase укажите **Project URL** вида `https://<ref>.supabase.co`, не `http://127.0.0.1:54321`.

3. Примените **все** SQL-миграции из `supabase/migrations/` в Supabase SQL Editor **по порядку имени файла**:

- `20260508160000_init_profiles.sql`
- `20260508164500_create_cases.sql`
- `20260509120000_fix_profiles_rls_recursion.sql`
- `20260509140000_add_curator_comment_for_client.sql`
- `20260509160000_admin_shared_client_access.sql`
- `20260509180000_cases_status_reached_at.sql`
- `20260519120000_client_cases_public_view.sql`

4. Запустите проект:

```bash
npm run dev
```

## Страницы

| URL | Назначение |
|-----|------------|
| `/auth` | Единая страница входа (клиент и админ) |
| `/dashboard` | Кабинет клиента |
| `/admin` | Главная админки |
| `/admin/clients` | Список клиентов |
| `/admin/clients/new` | Создание клиента |
| `/admin/clients/[id]` | Карточка клиента |
| `/admin/admins` | Список администраторов |
| `/admin/admins/[id]` | Карточка админа, сброс пароля |
| `/admin/create-admin` | Новый администратор |

Регистрации по ссылке нет: учётки создаёт администратор, пользователю отправляют `/auth`, email и пароль.

## Роли и доступ

- Роли: `admin`, `client`
- Маршруты защищены `middleware.ts` (в проде **не** включайте `SKIP_AUTH_MIDDLEWARE`)
- Клиент читает дело через view `cases_client_public` (без `internal_comment`)

## Первый администратор

1. Создайте пользователя в Supabase Auth (Dashboard → Authentication → Users).
2. В `profiles` должна появиться строка (триггер).
3. SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Либо создайте админа через `/admin/create-admin`, если уже есть один admin.

## Продакшен (Vercel)

В **Project → Settings → Environment Variables** добавьте:

| Переменная | Обязательно |
|------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | да |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да |
| `SUPABASE_SERVICE_ROLE_KEY` | да |
| `NEXT_PUBLIC_SITE_URL` | да (`https://ваш-домен.vercel.app`) |
| `BREVO_API_KEY` | для писем |
| `BREVO_SENDER_EMAIL` | для писем |
| `BREVO_SENDER_NAME` | для писем |

**Не добавляйте** на Vercel: `SKIP_AUTH_MIDDLEWARE`, `NODE_TLS_REJECT_UNAUTHORIZED`, `BREVO_SKIP_TLS_VERIFY`.

После изменения переменных сделайте **Redeploy**.

В Supabase: **отключить** публичную регистрацию (sign-up).

## Структура

- `app/` — страницы и server actions
- `components/` — UI и формы
- `lib/` — auth, Supabase, email, статусы дела
- `supabase/migrations/` — схема БД и RLS
