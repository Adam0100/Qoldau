# Qoldau

## Публикация на Render: одна ссылка

Ошибка `mvn: command not found` возникает из-за Node Runtime. Для этого проекта нужен **Web Service / Docker**. Dockerfile в корне собирает frontend (`npm ci`, `npm run build`), копирует `frontend/dist` в статические ресурсы Spring Boot, собирает Maven/Java 21 и запускает JAR в Java 21 JRE от непривилегированного пользователя. PostgreSQL в образ не входит. Локальные PowerShell-скрипты сохранены.

### 1. Отправить изменения в GitHub

Из корня проекта, после проверки `git diff`:

```powershell
git status
git diff --check
git add Dockerfile .dockerignore README.md backend/src backend/test.ps1 frontend/src/main.tsx frontend/src/api.ts frontend/vite.config.ts frontend/.env.example frontend/tests
git commit -m "Prepare single-domain Docker deployment on Render"
git push origin HEAD
```

Если remote ещё не настроен: `git remote add origin https://github.com/YOUR-ACCOUNT/Qoldau.git`, затем `git push -u origin HEAD`. `.runtime`, пароли, `.env`, node_modules и сборки не добавляйте.

### 2. Создать PostgreSQL

В Render выберите **New → Postgres**, имя, базу `qoldau`, пользователя и PostgreSQL **16**, регион будущего Web Service. Тариф и стоимость выберите самостоятельно; этот репозиторий ничего автоматически не создаёт. Дождитесь Available. Сохраните Hostname, Port, Database, Username и Password из Connections. Для приложения в том же регионе используйте внутренний hostname; внешний доступ к базе ограничьте. Настройте резервное копирование по возможностям выбранного тарифа. [Документация Render Postgres](https://render.com/docs/postgresql-creating-connecting).

### 3. Создать Web Service

**New → Web Service → GitHub → репозиторий Qoldau**, нужная ветка. Старый сервис с Node Runtime замените Docker-сервисом, если интерфейс не позволяет сменить Runtime.

| Поле | Значение |
| --- | --- |
| Service Type | Web Service |
| Language / Runtime | Docker |
| Region | Тот же регион, что у PostgreSQL |
| Root Directory | Оставить пустым — корень репозитория |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | Оставить пустым: используется ENTRYPOINT |
| Build / Start Command | Не задавать `mvn` или `npm`: сборка и запуск описаны Dockerfile |
| Health Check Path | `/health` |

`/health` публичен, проверяет соединение с БД: 200 `{"status":"UP"}`, при недоступной БД — 503 без подробностей подключения. [Docker на Render](https://render.com/docs/docker).

### 4. Переменные окружения Web Service

| Переменная | Значение / пример без секретов |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` (уже установлено в Dockerfile, не заменять локальным профилем) |
| `DB_URL` | `jdbc:postgresql://dpg-EXAMPLE-a:5432/qoldau` — реальные внутренний Hostname, Port и Database из Render |
| `DB_USER` | Реальный Username из Connections, например `qoldau` |
| `DB_PASSWORD` | Реальный Password, только в Environment Render; не в Git и не в Docker build args |
| `FRONTEND_ORIGIN` | `https://qoldau-example.onrender.com` — точный публичный адрес этого сервиса, без завершающего `/` и пути |
| `PORT` | Render задаёт автоматически; Spring слушает `0.0.0.0:${PORT}`, локально по умолчанию 8080 |
| `JAVA_TOOL_OPTIONS` | Необязательно: `-XX:MaxRAMPercentage=65.0`, если нужно ограничить heap с учётом памяти тарифа |

Render URL вида `postgresql://user:password@host/db` нельзя вставлять в `DB_URL` как есть: используйте JDBC-формат из таблицы, имя и пароль отдельно. Для внешней БД используйте её TLS-настройки (например `?sslmode=verify-full` с доверенным сертификатом). В production нет fallback на localhost: отсутствие обязательных настроек приводит к ошибке запуска.

Production-профиль включает обработку forwarded-заголовков reverse proxy Render, HTTPS Secure/HttpOnly session cookie и SameSite=Lax. `COOKIE_SECURE` и `COOKIE_SAME_SITE` нужны только для локального профиля; на Render их не задавайте. CSRF остаётся включённым, frontend получает токен через `/api/auth/csrf`; CORS разрешает только `FRONTEND_ORIGIN`. При подключении собственного домена обновите origin. Не открывайте backend напрямую в обход доверенного reverse proxy.

### 5. Deploy и проверка

Нажмите Deploy. Flyway автоматически применяет `V1__core.sql` и `V2__community_modules.sql` к новой базе, Hibernate проверяет схему (`validate`). Существующие миграции не меняйте; изменения схемы добавляйте новой миграцией. Локальная база автоматически на Render не переносится.

Откройте `https://YOUR-SERVICE.onrender.com`: зарегистрируйтесь, войдите, создайте просьбу, обновите `/profile/settings` и страницу `/requests/ID`, выйдите и войдите снова. Frontend и `/api` обслуживает один JAR на одном домене. Неизвестный `/api/...` возвращает JSON 401 без входа или 404 после входа, а не `index.html`; запрос изменения без CSRF получает 403. Для новых React-маршрутов обновляйте allowlist в `SpaController.java`.

### Данные, сессии и файлы

Загрузка файлов сейчас **не реализована**: нет upload endpoint, MultipartFile или записи пользовательских файлов на диск. Пользователи, просьбы, Wishes, Stars и аукционы находятся в отдельной PostgreSQL. Перезапуск приложения их не удаляет. Сессии хранятся в памяти: после deploy/перезапуска нужно войти повторно; пока используйте один экземпляр backend. Для нескольких экземпляров потребуется общее хранилище сессий, например Spring Session JDBC/Redis.

Если позже добавите загрузки, храните их в S3-совместимом object storage, а в PostgreSQL — ключи объектов. Альтернатива — подключённый Render Persistent Disk и отдельный каталог загрузок с резервным копированием; запись должна идти именно в mount path, с правами пользователя контейнера `qoldau`. Файлы в обычной файловой системе контейнера теряются при замене сервиса. Диск имеет ограничения масштабирования и доступности по тарифам; сейчас он приложению не нужен. [Persistent Disks](https://render.com/docs/disks).

### Проверка Docker вручную

Проверка запущенного production JAR с forwarded HTTPS подтвердила `Secure`, `HttpOnly`, `SameSite=Lax` у session cookie и заголовок HSTS. Это проверка приложения за имитированным proxy, а не фактического TLS-развёртывания на Render.

```powershell
docker build -t qoldau .
# .env.render.local создаётся локально, исключён из Git и Docker context.
# Укажите prod, DB_URL, DB_USER, DB_PASSWORD, FRONTEND_ORIGIN доступного HTTPS-прокси.
docker run --rm --env-file .env.render.local -p 8080:8080 qoldau
```

Для локального HTTP используйте существующие PowerShell-команды ниже: production Secure-cookie рассчитаны на HTTPS. Docker-сборка пропускает интеграционные тесты, которым нужна отдельная PostgreSQL; запускайте `backend/test.ps1` до публикации.

Учебная платформа взаимопомощи: React + Vite + React Router + Ant Design, Java 21 + Spring Boot + Spring Security + Spring Data JPA + Flyway, PostgreSQL 16. Локально — PowerShell; на Render — Docker и отдельная PostgreSQL.

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
- Адаптация под телефон и компьютер, BrowserRouter; Spring Boot открывает вложенные маршруты.

## Пока не реализовано

- Карта, геолокация, расстояния и сортировка «рядом»; сейчас Nearby requests — список с фильтром по городу.
- Личные чаты и уведомления; автор читает отклики на странице просьбы.
- Проверка знаменитостей, документов и происхождения лотов; модерация, загрузка фотографий, подтверждение получателя благотворительности.
- Реальная оплата, доставка и связь с победителем; ставки учебные и не списывают деньги.
- Восстановление/подтверждение email, ограничение частоты входа, административная панель.
- Сохранение сессий между перезапусками backend, отказоустойчивость и промышленная эксплуатация.

## Проверки

Повторный браузерный прогон 29.09.2026: **8 из 8 сценариев desktop/mobile прошли** против финального JAR со встроенным frontend на `http://localhost:18080`, с отдельной `qoldau_test`. Проверены регистрация, профиль, просьбы, community-модули, прямые вложенные URL и обновление страниц. Для повтора задайте `E2E_BASE_URL` адресом своего тестового JAR и выполните `npm.cmd test -- --workers=1` в `frontend`. Тестовые записи остаются только в `qoldau_test`.

Проверено 29.09.2026: `npm ci`, `npm run build`, Maven package и JAR со встроенным frontend — успешно. 8 backend-тестов на отдельной PostgreSQL 16.9 — успешно, включая production-профиль, CORS, CSRF, forwarded HTTPS, SPA и API 404. В этой Windows-среде стандартный fork Surefire не загрузил классы из пути проекта; повторный запуск с `-DforkCount=0` прошёл. Команда: `powershell -NoProfile -ExecutionPolicy Bypass -File backend/test.ps1 -DforkCount=0`. Docker CLI установлен, но Engine недоступен: **контейнер не собран и не проверен**.

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

Frontend всегда использует относительный `/api` и корень `/`. Для локального Vite можно задать `API_PROXY_TARGET`; в Docker эта настройка не используется.

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

