import { connect } from 'cloudflare:sockets'

/**
 * A minimal SMTP client over Cloudflare's TCP sockets, enough to send one alert email through
 * Gmail with an app password. nodemailer needs Node's net/tls/dns stack; this needs only
 * `cloudflare:sockets`. Port 465 = implicit TLS; any other port = STARTTLS. Port 25 is blocked on
 * Workers.
 */

export type SmtpConfig = { host: string; port: number; user: string; pass: string }
export type Mail = { from: string; to: string[]; replyTo?: string; subject: string; text: string; html: string }

const enc = new TextEncoder()
const dec = new TextDecoder()

/** UTF-8 safe base64 (btoa only takes Latin-1). */
function b64(s: string | Uint8Array): string {
  const bytes = typeof s === 'string' ? enc.encode(s) : s
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

const wrap76 = (s: string) => s.replace(/.{1,76}/g, '$&\r\n').trimEnd()
/** RFC 2047 encoded-word for non-ASCII header text. */
const header = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`)

export function buildMessage(mail: Mail, now = new Date()): string {
  const boundary = `gv-${crypto.randomUUID()}`
  const domain = mail.from.match(/@([^>\s]+)/)?.[1] ?? 'localhost'
  const lines = [
    `From: ${mail.from}`,
    `To: ${mail.to.join(', ')}`,
    ...(mail.replyTo ? [`Reply-To: ${mail.replyTo}`] : []),
    `Subject: ${header(mail.subject)}`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(mail.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(mail.html)),
    `--${boundary}--`,
  ]
  // Base64 bodies never start a line with ".", so no dot-stuffing is needed; headers are ours.
  return lines.join('\r\n')
}

type Conn = { reader: ReadableStreamDefaultReader<Uint8Array>; writer: WritableStreamDefaultWriter<Uint8Array>; buffer: string }

/** Reads one full reply (multi-line replies end with "NNN " rather than "NNN-"). */
async function reply(c: Conn): Promise<{ code: number; text: string }> {
  for (;;) {
    const lines = c.buffer.split('\r\n')
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const text = lines.slice(0, i + 1).join('\n')
        c.buffer = lines.slice(i + 1).join('\r\n')
        return { code: Number(lines[i].slice(0, 3)), text }
      }
    }
    const { value, done } = await c.reader.read()
    if (done) throw new Error('SMTP connection closed unexpectedly')
    c.buffer += dec.decode(value, { stream: true })
  }
}

async function command(c: Conn, line: string | null, expect: number, what: string) {
  if (line !== null) await c.writer.write(enc.encode(`${line}\r\n`))
  const r = await reply(c)
  // Never include the reply text: after AUTH it can echo credentials-related detail.
  if (r.code !== expect) throw new Error(`SMTP ${what} failed with ${r.code}`)
  return r
}

export async function sendMail(cfg: SmtpConfig, mail: Mail): Promise<void> {
  const implicitTls = cfg.port === 465
  let socket = connect({ hostname: cfg.host, port: cfg.port }, { secureTransport: implicitTls ? 'on' : 'starttls', allowHalfOpen: false })
  let c: Conn = { reader: socket.readable.getReader(), writer: socket.writable.getWriter(), buffer: '' }
  try {
    await command(c, null, 220, 'greeting')
    await command(c, 'EHLO ganga-vedha-api', 250, 'EHLO')
    if (!implicitTls) {
      await command(c, 'STARTTLS', 220, 'STARTTLS')
      c.reader.releaseLock()
      c.writer.releaseLock()
      socket = socket.startTls()
      c = { reader: socket.readable.getReader(), writer: socket.writable.getWriter(), buffer: '' }
      await command(c, 'EHLO ganga-vedha-api', 250, 'EHLO')
    }
    await command(c, `AUTH PLAIN ${b64(`\0${cfg.user}\0${cfg.pass}`)}`, 235, 'AUTH')
    await command(c, `MAIL FROM:<${cfg.user}>`, 250, 'MAIL FROM')
    for (const rcpt of mail.to) await command(c, `RCPT TO:<${rcpt}>`, 250, 'RCPT TO')
    await command(c, 'DATA', 354, 'DATA')
    await command(c, `${buildMessage(mail)}\r\n.`, 250, 'message')
    await c.writer.write(enc.encode('QUIT\r\n')).catch(() => {})
  } finally {
    await socket.close().catch(() => {})
  }
}

/** Opens a session and authenticates, then quits without sending: a safe credentials check. */
export async function verifySmtp(cfg: SmtpConfig): Promise<void> {
  const socket = connect({ hostname: cfg.host, port: cfg.port }, { secureTransport: 'on', allowHalfOpen: false })
  const c: Conn = { reader: socket.readable.getReader(), writer: socket.writable.getWriter(), buffer: '' }
  try {
    await command(c, null, 220, 'greeting')
    await command(c, 'EHLO ganga-vedha-api', 250, 'EHLO')
    await command(c, `AUTH PLAIN ${b64(`\0${cfg.user}\0${cfg.pass}`)}`, 235, 'AUTH')
    await c.writer.write(enc.encode('QUIT\r\n')).catch(() => {})
  } finally {
    await socket.close().catch(() => {})
  }
}
