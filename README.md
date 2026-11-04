# Сайт «АвтоЧехол ДВ»

Запуск: `node server.js` → http://localhost:8795

## Что заменить
- `data.js` → `CONFIG`: телефон, Telegram, WhatsApp, название, скидка.
- `data.js` → `PRICING`, `FABRICS`, `EXTRAS`, `BODIES`: закупка ткани ₽/м², пошив, наценка, площади кузовов.
- Цена = (площадь × закупка ткани + фикс + площадь × пошив + опции) × (1 + наценка).

## Заявки на ваш Telegram
1. Создайте бота у @BotFather → токен. Напишите боту /start, узнайте свой chat id (@userinfobot).
2. `TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node server.js`
Без этого заявки пишутся в `leads.jsonl`. В заявке: авто, кузов, ткань, расчёт (закупка/производство/наценка), цена, скидка, имя, телефон.
