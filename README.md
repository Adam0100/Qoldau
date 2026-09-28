# Qoldau

Учебная платформа взаимопомощи: React + Vite + React Router + Ant Design, Java 21 + Spring Boot + Spring Security + Spring Data JPA + Flyway, PostgreSQL 16. Без Docker.

Макеты не были доступны во входном сообщении. Интерфейс создан по описанию: зелёная палитра, карточки, адаптивная главная и навигация Home / Map / + / Messages / Profile.

## Быстрый запуск на этом компьютере (Windows PowerShell)

Установлены Java 21 и Node.js 24. PostgreSQL 17 на порту 5432 не используется и не изменяется. Для Qoldau подготовлен отдельный PostgreSQL **16.9**, порт **5433**, данные в исключённой из Git папке `.runtime/pgdata`.

Откройте PowerShell в `C:\Users\Aron\Desktop\Проекты\Qoldau`.

**1. PostgreSQL:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\database.ps1 start
```

Первый запуск скачивает бинарную сборку PostgreSQL с сайта EnterpriseDB, создаёт локальный кластер и базу `qoldau`. Пароль генерируется криптографически и сохраняется через Windows DPAPI в `.runtime/database-password.xml`, привязан к текущей учётной записи Windows. Открытый пароль в исходниках отсутствует. Архив и бинарники не входят в Git. Сервер слушает только localhost.

**2. Backend, отдельный терминал:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\start.ps1
```

API: http://localhost:8080/api/requests. Maven 3.9.9 автоматически скачивается с проверкой SHA-512; глобальная установка Maven не нужна. Flyway создаёт таблицы при первом запуске. Hibernate только проверяет схему.

**3. Frontend, отдельный терминал:**

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Откройте **http://localhost:5173**. Используйте именно localhost, а не 127.0.0.1, чтобы origin совпадал с настройками API. Vite проксирует `/api` на backend. Создайте свой аккаунт; предустановленных пользователей и демоданных нет.

Остановка frontend/backend: Ctrl+C в соответствующем терминале.

```powershell
# Из корня проекта:
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\database.ps1 status
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\database.ps1 stop
```

Не удаляйте `.runtime/pgdata`: это ваши данные. Кластер из учебного скрипта использует владельца qoldau с правами администратора; для публикации создайте отдельного пользователя БД с минимальными правами.

## Если используется самостоятельно установленный PostgreSQL 16

Создайте роль и базу интерактивно, чтобы пароль не попадал в историю команд:

```powershell
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres -d postgres
```

В psql:

```sql
CREATE ROLE qoldau LOGIN;
\password qoldau
CREATE DATABASE qoldau OWNER qoldau;
\q
```

Затем в PowerShell:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5432/qoldau'
$env:DB_USER = 'qoldau'
$secret = Read-Host 'Пароль базы' -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
cd backend
.\mvnw.cmd -B -ntp spring-boot:run
```

На Linux/macOS установите JDK 21, Maven 3.9+ и PostgreSQL 16; задайте DB_URL, DB_USER, DB_PASSWORD через окружение, запустите `mvn spring-boot:run` в backend. Windows-скрипты не нужны.

## Реализовано

- Регистрация, вход и выход, профиль текущего пользователя с редактированием.
- Пароли BCrypt, серверная сессия, HttpOnly cookie, защита от CSRF, CORS с одним явно заданным origin.
- Создание, просмотр, изменение и закрытие просьб; фильтры города/категории и пагинация по 20 записей.
- Только автор может редактировать просьбу и читать её отклики. Самоотклики запрещены, повторный отклик ограничен уникальным индексом. На закрытую просьбу откликнуться нельзя.
- Stars — публикация, обновление и снятие собственной истории помощи, каталог участников. Это добровольный каталог, а не выдуманный рейтинг или проверенный статус знаменитости.
- Wishes — публикация, поддержка другим участником, подтверждение исполнения только автором. Блокировка строки предотвращает двойную поддержку.
- Аукционы — создание лотов с заявленным именем знаменитости и благотворительной целью, временем начала/окончания, начальной ценой в KZT; история ставок и победитель.
- Ставки обрабатываются транзакционно с `SELECT FOR UPDATE`: время и текущая цена проверяются после получения блокировки, деньги хранятся в NUMERIC/BigDecimal. Равные ставки и ставки продавца запрещены.
- Закрытие аукционов каждые 5 секунд и при открытии карточки. После простоя backend завершает просроченные лоты. Победитель — автор максимальной принятой ставки; без ставок победителя нет. Повторное завершение безопасно.
- Реальные состояния загрузки, пустого списка, ошибки API. Никаких фиктивных «живых» записей.
- Адаптация под телефон и компьютер, HashRouter для статического хостинга.

## Пока не реализовано

- Карта, геолокация, расстояния и сортировка «рядом»; сейчас Nearby requests — список с фильтром по городу.
- Личные чаты и уведомления; автор читает отклики на странице просьбы.
- Проверка знаменитостей, документов и происхождения лотов; модерация, загрузка фотографий, подтверждение получателя благотворительности.
- Реальная оплата, доставка и связь с победителем; ставки учебные и не списывают деньги.
- Восстановление/подтверждение email, ограничение частоты входа, административная панель.
- Сохранение сессий между перезапусками backend, отказоустойчивость и промышленная эксплуатация.

## Проверки

Проверено на этом компьютере 28.09.2026: `mvn package` — успешно, 5 интеграционных тестов — успешно, `npm run build` — успешно, 4 браузерных теста (desktop/mobile) — успешно. Исполняемый JAR запущен с PostgreSQL 16.9; API и frontend отвечают. Созданные при проверке записи удалены из основной базы.

PostgreSQL должен быть запущен. Backend-тесты используют **отдельную** базу `qoldau_test`, не основную базу.

```powershell
# Из корня:
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\test.ps1

cd frontend
npm.cmd run build
npx.cmd playwright install chromium
# Backend и frontend должны быть запущены:
npm.cmd test
```

Backend: CSRF, анонимный доступ, валидация, профиль, права автора, самоотклик и повторный отклик, закрытые просьбы, Stars, Wishes, конкурентные ставки, будущие и завершённые аукционы, победитель.

Браузерные тесты проходят реальные регистрацию, вход, публикацию просьбы, отклик второго участника, изменение профиля, Stars, поддержку и исполнение Wishes, создание лота и ставку в размерах 1440×1000 и 390×844. Они создают записи с обозначением теста. Для изоляции запустите отдельный backend с `DB_URL=jdbc:postgresql://localhost:5433/qoldau_test`. Скриншоты сохраняются в `frontend/test-results/` (не Git).

## Конфигурация

| Переменная backend | По умолчанию |
| --- | --- |
| DB_URL | jdbc:postgresql://localhost:5433/qoldau |
| DB_USER | qoldau |
| DB_PASSWORD | Обязательна; start.ps1 читает DPAPI-файл |
| PORT | 8080 |
| FRONTEND_ORIGIN | http://localhost:5173 |
| COOKIE_SECURE | false для локального HTTP |
| COOKIE_SAME_SITE | lax |

Frontend: `VITE_API_URL` (по умолчанию `/api`), `VITE_BASE_PATH` (по умолчанию `/`). Пример в `frontend/.env.example`. Vite-переменные публичны: секретов в них быть не должно.

## API

Все пути начинаются с `/api`. Для изменяющих запросов сначала GET `/auth/csrf`, затем передавайте `token` в заголовке `X-CSRF-TOKEN` и сохраняйте cookie. После входа/выхода frontend получает новый CSRF-токен.

| Модуль | Методы |
| --- | --- |
| Auth | GET /auth/csrf; POST /auth/register, /auth/login, /auth/logout |
| Профиль | GET, PUT /me |
| Просьбы | GET, POST /requests; GET, PUT /requests/{id} |
| Отклики | POST /requests/{id}/responses; GET только автору |
| Stars | GET /stars; PUT, DELETE /stars/me |
| Wishes | GET, POST /wishes; POST /wishes/{id}/pledge, /fulfill |
| Аукционы | GET, POST /auctions; GET /auctions/{id}; GET, POST /auctions/{id}/bids |

Списки: `?page=0`, ответ `{items,total}`. Просьбы: дополнительные `city` и `category` (EVERYDAY, TRANSPORT, EDUCATION, OTHER). Статусы просьб OPEN/CLOSED; желаний OPEN/PLEDGED/FULFILLED. Даты аукционов — ISO 8601 UTC; интерфейс отображает местное время.

Ошибки: `{message,fields?}`, HTTP 400 — невалидные данные, 401 — нет входа, 403 — права/CSRF, 404 — нет записи, 409 — конфликт состояния или дубликат. Чужие email и хеши паролей в публичных ответах отсутствуют.

## GitHub Pages и размещение

GitHub Pages подходит **только для frontend**. PostgreSQL и Java API нужно разместить отдельно; этот проект никуда автоматически не публикуется.

Для репозитория Qoldau:

```powershell
cd frontend
$env:VITE_BASE_PATH = '/Qoldau/'
$env:VITE_API_URL = 'https://api.example.org/api'
npm.cmd ci
npm.cmd run build
```

Опубликуйте содержимое `frontend/dist` через Pages/Actions. Для собственного домена base должен быть `/`. HashRouter сохраняет переходы и обновление страницы (`/#/requests/1`) без настройки серверных rewrite.

На API задайте `FRONTEND_ORIGIN=https://YOUR-NAME.github.io` (без пути репозитория), `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, HTTPS. Браузер может блокировать сторонние cookie между github.io и отдельным доменом API. Для устойчивой сессионной авторизации используйте собственные домены одного сайта, например app.example.org и api.example.org, либо reverse proxy. Не отключайте CSRF и не используйте CORS "*".

Перед публичным размещением обновите зависимости и PostgreSQL до актуального патча, настройте секреты, резервные копии, ограничения доступа к БД и недостающие функции эксплуатации.

## Структура

```text
frontend/src/       интерфейс, API-клиент, страницы
frontend/tests/     браузерные проверки
backend/src/main/java/kz/qoldau/
  auth/            пользователи и Spring Security
  requests/        просьбы и отклики
  stars/           истории участников
  wishes/          желания и поддержка
  auctions/        лоты, ставки, блокировки, завершение
  common/          ошибки API
backend/src/main/resources/db/migration/
backend/src/test/  интеграционные проверки PostgreSQL
.runtime/          локальные инструменты, данные, секреты (не Git)
```

Требования к среде сверены с [Spring Boot](https://docs.spring.io/spring-boot/3.5/system-requirements.html) и [Vite](https://vite.dev/guide/).

