#!/usr/bin/env node
// tg.mjs — one Telegram line from the finish-line loop through your bot.
// usage: node scripts/tg.mjs "<text>" [--silent]
// The bot token and chat id live in .loop-secrets.json (gitignored, written by hand once);
// no agent in the loop ever reads a secrets file. Exit 0 on success, 1 on failure.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const text = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ').trim();
const silent = process.argv.includes('--silent');
if (!text) { console.error('tg: text required'); process.exit(1); }

let cfg;
try { cfg = JSON.parse(readFileSync(join(here, '..', '.loop-secrets.json'), 'utf8')); }
catch { console.error('tg: .loop-secrets.json missing'); process.exit(1); }
const { telegram_bot_token: token, telegram_chat_id: chat } = cfg;
if (!token || !chat) { console.error('tg: token or chat id missing'); process.exit(1); }

const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: chat, text: text.slice(0, 3900), disable_web_page_preview: true, disable_notification: silent }),
});
const j = await r.json().catch(() => ({}));
if (!r.ok || !j.ok) { console.error('tg: failed', r.status, JSON.stringify(j).slice(0, 200)); process.exit(1); }
console.log('tg: sent', j.result?.message_id);
