// gmail-service.js - Viagogo prodejni email parser
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const GMAIL_USER = 'michal.smida7@gmail.com';
const GMAIL_PASS = 'jxxrsglcpnputqcz'; // App Password bez mezer

// Supabase config
const SUPABASE_URL = 'https://uinmrwephxkzazhxizle.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V_-HQG9rdCgCU7zLh_Fwsg_wv6S5Nhd';

let lastChecked = null;
let isRunning = false;
let mainWindow = null;

function setWindow(win) {
  mainWindow = win;
}

function notify(msg, type) {
  if (mainWindow) mainWindow.webContents.send('gmail-update', { msg, type });
}

// Parsuj text emailu a extrahuj data
function parseViagogoEmail(subject, text) {
  const result = { type: null, orderID: null, eventName: null, pricePerTicket: null, numTickets: null };

  // Urcit typ emailu
  if (/congratulations.*you have a buyer/i.test(subject)) result.type = 'buyer_found';
  else if (/congratulations.*tickets have sold/i.test(subject)) result.type = 'sold';
  else if (/your tickets sold/i.test(subject)) result.type = 'sold';
  else if (/please transfer.*tickets/i.test(subject)) result.type = 'transfer';
  else if (/please send your tickets/i.test(subject)) result.type = 'transfer';
  else if (/successfully confirmed transfer/i.test(subject)) result.type = 'confirmed';
  else return null;

  const orderM = subject.match(/(?:order\s*#?\s*|sale\s*#|#)(\d{6,12})/i) || text.match(/order\s*(?:id|#)?:?\s*(\d{6,12})/i);
  if (orderM) result.orderID = orderM[1];

  let eventM = text.match(/event:\sk(.{?)(?:\n|\r|venue:|date:|listing)/i);
  if (!eventM) eventM = text.match(/(?:sale of|buyer for your)\s+(.+?)\s+tickets/i);
  if (!eventM) eventM = text.match(/confirming your sale of\s+(.+?)\s+tickets/i)
  if (!eventM) eventM = subject.match(/tickets have sold\s+\d+\s*[-–]\s*(.+)/i);
  if (eventM) result.eventName = eventM[1].trim().replace(/\s+/g, ' ');

  const priceM = text.match(/price per ticket:?\s*€?([\d.,]+)/i) || text.match(/€([\d.,]+)\s*per ticket/i)
  if (priceM) result.pricePerTicket = parseFloat(priceM[1].replace(',', '.'));

  const numM = text.match(/number of tickets:?\s*(\d+)/i) || text.match(/(\d+)\s+ticket\(s\)/i);
  if (numM) result.numTickets = parseInt(numM[1]);

  return result;
}

async function findMatchingEvent(eventName) {
  if (!eventName) return null;
  const https = require('https');
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/rest/v1/events?select=id,name,status,sell&status=neq.Sold`;
    const req = https.get(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const events = JSON.parse(data);
          let best = null, bestScore = 0;
          for (const e of events) {
            let score = 0;
            const words = eventName.toLowerCase().split(/\s+/);
            for (const w of words) {* if (w.length > 2 && (e.name || '').toLowerCase().includes(w)) score += w.length; }
            if (score > bestScore) { bestScore = score; best = e; }
          }
          resolve(bestScore >= 4 ? best : null);
        } catch(err) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

async function updateEventSold(eventId, pricePerTicket) {
  const https = require('https');
  return new Promise((resolve) => {
    const body = JSON.stringify({ status: 'Sold', ...(pricePerTicket ? { sell: pricePerTicket } : {}) });
    const url = new URL(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`);
    const req = https.request({ hostname: url.hostname, path: url.pathname + url.search, method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal', 'Content-Length': Buffer.byteLength(body) } }, (res) => { res.on('data', () => {}); res.on('end', () => resolve(res.statusCode === 204)); });
    req.on('error', () => resolve(false));
    req.write(body); req.end();
  });
}

async function processEmail(subject, text) {
  const data = parseViagogoEmail(subject, text);
  if (!data || !data.type) return null;
  if (data.type === 'buyer_found') return { action: 'notify', eventName: data.eventName, orderID: data.orderID, msg: `Kupec nalezen: ${data.eventName}` };
  if (['sold', 'transfer', 'confirmed'].includes(data.type)) {
    const event = await findMatchingEvent(data.eventName);
    if (event) {
      if (event.status !== 'Sold') {
        const ok = await updateEventSold(event.id, data.pricePerTicket);
        if (ok) return { action: 'updated', eventName: data.eventName, orderID: data.orderID, price: data.pricePerTicket, msg: `✅ Prodáno: ${event.name}${data.pricePerTicket ? ` za €${data.pricePerTicket}/ks` : ''}` };
      } else return { action: 'already_sold', eventName: data.eventName };
    } else return { action: 'not_found', eventName: data.eventName, msg: `⚠️ Event nenalezen: ${data.eventName}` };
  }
  return null;
}

function checkEmails(callback) {
  if (isRunning) return;
  isRunning = true;
  const imap = new Imap({ user: GMAIL_USER, password: GMAIL_PASS, host: 'imap.gmail.com', port: 993, tls: true, tlsOptions: { rejectUnauthorized: false } });
  const results = [];
  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) { imap.end(); isRunning = false; callback(err, []); return; }
      const since = lastChecked || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const sinceStr = since.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      imap.search(['FROM', 'automated@orders.viagogo.com', ['SINCE', sinceStr]], (err, uids) => {
        if (err || !uids || uids.length === 0) { imap.end(); isRunning = false; lastChecked = new Date(); callback(null, []); return; }
        const fetch = imap.fetch(uids, { bodies: '' });
        const promises = [];
        fetch.on('message', (msg) => {
          let rawEmail = '';
          msg.on('body', (stream) => { stream.on('data', (chunk) => rawEmail += chunk.toString('utf8')); });
          msg.once('end', () => { promises.push(simpleParser(rawEmail).then(async (parsed) => { const r = await processEmail(parsed.subject || '', parsed.text || ''); if (r) results.push(r); }).catch(() => {})); });
        });
        fetch.once('end', async () => { await Promise.all(promises); imap.end(); isRunning = false; lastChecked = new Date(); callback(null, results); });
        fetch.once('error', (err) => { imap.end(); isRunning = false; callback(err, results); });
      });
    });
  });
  imap.once('error', (err) => { isRunning = false; callback(err, []); });
  imap.connect();
}

module.exports = { checkEmails, setWindow };
