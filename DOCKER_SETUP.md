# Docker Setup Guide

## Быстрый старт

```bash
# 1. Клонируй репозиторий
git clone <repo-url>
cd git.mtuci

# 2. Настрой переменные окружения
cp backend/.env.example backend/.env
# Отредактируй backend/.env — укажи реальный GITEA_TOKEN и JWT_SECRET_KEY

# 3. Запусти всё одной командой
docker-compose up --build

# 4. Открой в браузере
# Frontend: http://localhost:3001
# Backend API: http://localhost:8000/docs
# Gitea: http://localhost:3000
```

## Что исправлено для Docker

### 1. ✅ Networking (localhost → имена сервисов)
- `backend/.env`: `POSTGRES_HOST=postgres` (было localhost)
- `backend/.env`: `GITEA_URL=http://gitea:3000` (было localhost)
- `backend/.env`: `DATABASE_URL=postgresql+asyncpg://mtuci:mtuci@postgres:5432/mtuci`

### 2. ✅ Environment Variables
- Все переменные в `backend/.env` подхватываются автоматически через `env_file`
- Docker Compose пробрасывает нужные переменные в каждый контейнер

### 3. ✅ Database
- PostgreSQL 16 в отдельном контейнере
- Volume `postgres_data` — данные сохраняются при перезапуске
- Healthcheck ждёт готовности БД перед стартом api и gitea

### 4. ✅ Volumes (данные не теряются)
```yaml
volumes:
  postgres_data:  # База данных
  gitea_data:     # Репозитории и пользователи Gitea
```

### 5. ✅ Frontend → Backend
- CORS настроен в `backend/main.py`: разрешены `localhost:3001` и `frontend:3001`
- Frontend проксирует API запросы через Vite dev server

### 6. ✅ Depends On & Healthchecks
- `api` ждёт `postgres` и `gitea` (condition: service_healthy)
- `frontend` ждёт `api`
- `gitea` ждёт `postgres`

## Полезные команды

```bash
# Пересобрать всё
docker-compose up --build

# Фоновый режим
docker-compose up -d

# Остановить всё
docker-compose down

# Остановить и удалить данные (ОСТОРОЖНО!)
docker-compose down -v

# Логи конкретного сервиса
docker-compose logs -f api
docker-compose logs -f gitea

# Выполнить команду внутри контейнера
docker-compose exec api bash
docker-compose exec postgres psql -U mtuci -d mtuci
```

## Первоначальная настройка Gitea

После первого запуска:

1. Открой http://localhost:3000
2. Войди под админом (из `.env`):
   - Username: `gitea_admin`
   - Password: `admin12345` (или что указано в GITEA_ADMIN_PASSWORD)
3. Создай access token: Settings → Applications → Generate Token
4. Скопируй токен в `backend/.env` → `GITEA_TOKEN=...`
5. Перезапусти: `docker-compose restart api`

## Troubleshooting

### Порт занят
Если порт 3000 или 8000 занят:
```yaml
# В docker-compose.yml измени:
ports:
  - "3002:3000"  # вместо 3000:3000
```

### Permission denied (Linux/Mac)
```bash
sudo chown -R $USER:$USER .
```

### База не инициализирована
```bash
# Выполни миграции вручную
docker-compose exec api alembic -c alembic.ini upgrade head
```

## Структура проекта в Docker

```
┌─────────────────────────────────────────────┐
│           Docker Compose Network            │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │frontend │  │  api    │  │    gitea    │ │
│  │ :3001   │  │ :8000   │  │   :3000     │ │
│  │ (React) │  │(FastAPI)│  │             │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │        │
│       └────────────┴──────────────┘        │
│                    │                       │
│              ┌─────────┐                    │
│              │ postgres│                    │
│              │ :5432   │                    │
│              └─────────┘                    │
└─────────────────────────────────────────────┘
```

## Готово!

После `docker-compose up --build` всё будет работать:
- ✅ Frontend на http://localhost:3001
- ✅ Backend API на http://localhost:8000
- ✅ Gitea на http://localhost:3000
- ✅ База данных сохраняет данные
- ✅ Автоматические миграции при старте
