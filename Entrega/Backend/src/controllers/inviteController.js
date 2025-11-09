// src/controllers/inviteController.js
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { processOutboxOnce } from '../services/emailService.js';

// ======= Configurações =======
const TIPOS_VALIDOS = new Set(["Mentor", "Colaborador", "Administrador"]);

const hashToken = (t) => crypto.createHash("sha256").update(t).digest();

// ======= SMTP (e-mail) =======
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

// ======= Controlador: Enviar Convite =======
export async function convidar(req, res) {
  try {
    const { email, tipo, groupId, invitedByUserId } = req.body || {};

    // ======= Validações =======
    if (!email || !tipo || !groupId || !invitedByUserId) {
      return res.status(400).json({
        error: "Campos obrigatórios: email, tipo, groupId, invitedByUserId.",
      });
    }

    if (!TIPOS_VALIDOS.has(tipo)) {
      return res.status(400).json({
        error:
          "Tipo inválido. Use: Mentor | Colaborador | Gestor | Administrador.",
      });
    }

    console.log("Email:", email);
    console.log("Tipo:", tipo);
    console.log("groupId:", groupId);
    console.log("invitedByUserId:", invitedByUserId);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verifica duplicidade de convites pendentes
      const [dup] = await conn.query(
        `SELECT id FROM invitations 
         WHERE email=? AND group_id=? AND status='pending' LIMIT 1`,
        [email, groupId]
      );
      if (dup.length) {
        await conn.rollback();
        return res.status(409).json({
          error: "Já existe um convite pendente para este e-mail neste grupo.",
        });
      }

      // Insere convite
      const [ins] = await conn.query(
        `INSERT INTO invitations 
         (group_id, email, role, token_hash, status, expires_at, invited_by_user_id)
         VALUES (?, ?, ?, ?, 1,DATE_ADD(NOW(), INTERVAL 7 DAY), 0)`,
        [groupId, email, tipo, tokenHash]
      );

      // Monta URL para aceitar convite
      const acceptUrl = `${
        process.env.APP_BASE_URL || "http://localhost:5173"
      }/aceitar-convite?token=${token}`;

      // Envia e-mail (ou registra na fila)
      await conn.query(
        `INSERT INTO email_outbox (to_email, subject, body_text, body_html)
         VALUES (?, ?, ?, ?)`,
        [
          email,
          "Convite para participar do grupo Auria",
          `Você foi convidado(a) como ${tipo}. Para aceitar, acesse: ${acceptUrl}`,
          `<p>Você foi convidado(a) como <strong>${tipo}</strong>.</p>
           <p><a href="${acceptUrl}">Clique aqui para aceitar</a></p>`,
        ]
      );

      await conn.commit();
      try {
        await processOutboxOnce();
      } catch (e) {
        console.error("Erro ao processar outbox imediatamente:", e);
      }

      // Retorno de sucesso
      return res.status(201).json({
        ok: true,
        inviteId: ins.insertId,
        devToken: token,
      });
    } catch (e) {
      await conn.rollback();
      console.error("Erro na transação de convite:", e);
      return res.status(500).json({ error: "Erro ao criar convite." });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Erro geral no convidar:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
}

// ======= Validar Convite =======
export async function validarConvite(req, res) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string")
      return res.status(400).json({ error: "Token ausente." });

    const tHash = hashToken(token);

    const [rows] = await pool.query(
      `SELECT id, email, group_id AS groupId, tipo, status, expires_at AS expiresAt
       FROM invitations
       WHERE token_hash=? AND status='pending' AND expires_at > NOW()
       LIMIT 1`,
      [tHash]
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ error: "Convite inválido, expirado ou já utilizado." });

    const inv = rows[0];
    return res.json({
      ok: true,
      email: inv.email,
      groupId: inv.groupId,
      tipo: inv.tipo,
      expiresAt: inv.expiresAt,
    });
  } catch (err) {
    console.error("validarConvite error:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
}

// ======= Registrar Convite =======
export async function registrarConvite(req, res) {
  try {
    const { token, name, password } = req.body || {};
    if (!token || !name || !password)
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: token, name, password." });

    const tHash = hashToken(token);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invRows] = await conn.query(
        `SELECT id, email, group_id AS groupId, tipo
         FROM invitations
         WHERE token_hash=? AND status='pending' AND expires_at > NOW()
         FOR UPDATE`,
        [tHash]
      );

      if (!invRows.length) {
        await conn.rollback();
        return res.status(404).json({
          error: "Convite inválido, expirado ou já utilizado.",
        });
      }

      const inv = invRows[0];
      const hash = await bcrypt.hash(password, 10);

      // Verifica se o usuário já existe
      const [u] = await conn.query(
        `SELECT id FROM users WHERE email=? LIMIT 1`,
        [inv.email]
      );
      let userId;

      if (u.length) {
        await conn.query(
          `UPDATE users
           SET name = COALESCE(?, name),
               group_id = COALESCE(?, group_id),
               type = ?,
               password = ?,
               status = 1
           WHERE email = ?`,
          [name, inv.groupId, inv.tipo, hash, inv.email]
        );
        const [u2] = await conn.query(`SELECT id FROM users WHERE email=?`, [
          inv.email,
        ]);
        userId = u2[0].id;
      } else {
        const [insUser] = await conn.query(
          `INSERT INTO users (group_id, name, email, type, password, status)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [inv.groupId, name, inv.email, inv.tipo, hash]
        );
        userId = insUser.insertId;
      }

      await conn.query(
        `UPDATE invitations SET status='accepted', accepted_at=NOW() WHERE id=?`,
        [inv.id]
      );

      await conn.commit();
      return res.status(201).json({
        ok: true,
        userId,
        email: inv.email,
        tipo: inv.tipo,
      });
    } catch (e) {
      await conn.rollback();
      console.error("registrarConvite tx error:", e);
      return res.status(500).json({ error: "Erro ao registrar via convite." });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("registrarConvite error:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
}
