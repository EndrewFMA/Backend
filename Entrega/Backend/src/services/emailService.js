// src/services/emailService.js
import nodemailer from 'nodemailer';
import { pool } from '../db.js';

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false, // true apenas se porta = 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // opcional (ajuda em ambientes locais)
  }
});
/* console.log('estou aqui'); */

/* console.log({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS ? '********' : 'undefined',
}); */
/** Enfileira um e‑mail na tabela email_outbox */

export async function enqueueEmail({ to, subject, html, text }) {
  await pool.query(
    `INSERT INTO email_outbox (to_email, subject, body_html, body_text)
     VALUES (?, ?, ?, ?)`,
    [to, subject, html || null, text || null]
  );
}

/** Processa até N itens da outbox */
export async function processOutboxOnce(limit = 10) {
  const [rows] = await pool.query(
    `SELECT * FROM email_outbox
     WHERE sent_at IS NULL AND retries < 5
     ORDER BY id
     LIMIT ?`,
    [limit]
  );
  //console.log("Rows to send:", rows);

  for (const msg of rows) {
    try {
      const info = await transporter.sendMail({
        from: 'no-reply@auria.local',/* process.env.MAIL_FROM ||  */
        to: msg.to_email, 
        subject: msg.subject,
        text: msg.body_text || undefined,
        html: msg.body_html || undefined
      });
      console.log(info);
      await pool.query(`UPDATE email_outbox SET sent_at = NOW() WHERE id = ?`, [msg.id]);
    } catch (e) {
      
      await pool.query(
        `UPDATE email_outbox SET retries = retries + 1, last_error = ? WHERE id = ?`,
        [String(e), msg.id]
      );
    }
  }
  return rows.length;
}