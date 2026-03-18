---
summary: "Max messenger (VK) bot integration for MatryoshkaClaw"
title: "Max Messenger"
---

# Max Messenger 📱

Max — российский мессенджер от VK. MatryoshkaClaw — первая AI-агент платформа с открытой интеграцией Max Bot API.

## Быстрая настройка

### 1. Создайте бота в Max

Откройте [@MasterBot](https://max.ru/MasterBot) в приложении Max и создайте бота. Сохраните токен.

### 2. Настройте MatryoshkaClaw

```json5
{
  channels: {
    max: {
      enabled: true,
      botToken: "ваш-токен-здесь",
      dmPolicy: "pairing",   // allow | pairing | deny
    },
  },
}
```

Переменная окружения: `MAX_BOT_TOKEN=...`

### 3. Запустите

```bash
matryoshka gateway start
matryoshka pairing list max
matryoshka pairing approve max <CODE>
```

## Возможности

| Функция | Статус |
|---------|--------|
| Личные сообщения (DM) | ✅ |
| Групповые чаты | ✅ |
| Long polling | ✅ |
| Webhook | ✅ |
| Inline-кнопки | ✅ |
| Отправка текста | ✅ |
| Markdown/HTML форматирование | ✅ |
| Файлы и медиа | 🚧 в разработке |
| Голосовые сообщения | 🚧 в разработке |

## Конфигурация

```typescript
interface MaxChannelConfig {
  botToken: string;          // Токен бота от @MasterBot
  dmPolicy?: "allow"         // Разрешить всем
             | "pairing"     // Требовать подтверждения (по умолчанию)
             | "deny";       // Запретить DM
  webhookPort?: number;      // Порт для webhook-режима
  webhookPath?: string;      // Путь (по умолчанию: /max-webhook)
}
```

## Режимы получения обновлений

### Long Polling (по умолчанию)

Не требует публичного URL. Бот сам опрашивает Max API каждые 30 секунд.

```json5
{
  channels: {
    max: {
      enabled: true,
      botToken: "token",
    },
  },
}
```

### Webhook

Требует публичного HTTPS URL. Быстрее и эффективнее для нагруженных ботов.

```json5
{
  channels: {
    max: {
      enabled: true,
      botToken: "token",
      webhookPort: 8443,
      webhookPath: "/max-webhook",
    },
  },
}
```

## Использование в коде

```typescript
import { createMaxChannel } from "@matryoshkaclaw/max";

const channel = createMaxChannel({ botToken: "your-token" });

// Проверить токен
const probe = await channel.probe();
console.log(probe); // { ok: true, botName: "МойБот" }

// Получать сообщения
channel.startPolling(async (msg) => {
  console.log(`${msg.senderName}: ${msg.text}`);

  // Ответить
  if (msg.userId) {
    await channel.sendText({ userId: msg.userId }, "Привет! 🪆");
  }
});

// Отправить с кнопками
await channel.sendWithButtons(
  { userId: 12345 },
  "Выбери действие:",
  [[
    { text: "✅ Да", payload: "confirm" },
    { text: "❌ Нет", payload: "cancel" },
  ]]
);
```

## API Reference

Полная документация: [dev.max.ru/docs](https://dev.max.ru/docs)

Base URL: `https://botapi.max.ru`
Auth: `?access_token=<TOKEN>`

### Основные методы

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `getMe()` | `GET /me` | Информация о боте |
| `getUpdates()` | `GET /updates` | Long polling |
| `sendMessage()` | `POST /messages` | Отправить сообщение |
| `deleteMessage()` | `DELETE /messages/{id}` | Удалить сообщение |
| `getChats()` | `GET /chats` | Список чатов бота |
| `setWebhook()` | `POST /subscriptions` | Установить webhook |
| `deleteWebhook()` | `DELETE /subscriptions` | Удалить webhook |
| `answerCallback()` | `POST /answers` | Ответить на кнопку |

## Отличия от Telegram

| | Max | Telegram |
|--|-----|----------|
| Auth | `?access_token=TOKEN` | Bot token в заголовке |
| Long poll timeout | до 30 сек | до 60 сек |
| Max сообщение | 4000 символов | 4096 символов |
| Создание бота | @MasterBot в Max | @BotFather в Telegram |
| Формат | Markdown / HTML | MarkdownV2 / HTML |

## Устранение проблем

**`Invalid access_token`** — проверьте токен в @MasterBot, возможно бот был пересоздан.

**Нет обновлений при long polling** — убедитесь что webhook не установлен (они несовместимы).

**Сообщение не доставлено** — пользователь должен сначала написать боту или добавить его в чат.
