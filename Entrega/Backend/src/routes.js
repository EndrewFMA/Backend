import { json, Router } from "express"; // Importa Express e Router
import express from 'express';
import path from "path";
import pool from "./db.js"; // Importa pool de conexões com MySQL
import fs from "fs";
import upload from "./uploadConfig.js";
import { profile, updateMe, deleteUser } from "./controllers/userController.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import {
  convidar,
  validarConvite,
  registrarConvite,
} from "./controllers/inviteController.js";
import { login, register, forgotPassword, logout, resetPassword } from "./controllers/authController.js";
import { GoogleGenerativeAI } from "@google/generative-ai";


const r = Router(); // Cria instância de rotas
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//Público
r.post("/auth/register", register);
r.post("/auth/login", login);
r.post("/auth/forgot-password", forgotPassword);
r.post("/auth/reset-password/:token", resetPassword);

//Privado
r.post("/auth/logout", authMiddleware, logout);
r.get("/users/profile", authMiddleware, profile);
r.put("/users/me", authMiddleware, updateMe);
/* r.put("/users/deact/:id", authMiddleware, updateStatus); */
r.delete("/users/:id", authMiddleware, deleteUser);

// Rotas de convite (sem /api aqui!)
r.post("/convidar", convidar);
r.get("/convites/validar", validarConvite);
r.post("/convites/registrar", registrarConvite);

// ping local só pra testar caminho
r.get("/convidar/_ping", (req, res) => res.json({ ok: true }));

//GET http://localhost:3000/api/db/health
r.get("/db/health", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS db_ok");
    res.json({ ok: true, db: rows[0].db_ok }); // Retorna sucesso se o banco responder
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.put("/users/deact/:id", async (req, res) => {
  const { id, status } = req.body;
  console.log("updateStatus called with:", { id, status });

  if (!id || typeof status === 'undefined') {
    return res.status(400).json({ error: "Envie o id e o novo status" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    console.log(rows);

    await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);

    const [updated] = await pool.query(
      "SELECT id, name, email, status, created_at FROM users WHERE id = ?",
      [id]
    );

    return res.json(updated[0]);
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

//GET http://localhost:3000/api/users/list
r.get("/users/list", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json({ ok: true, users: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.get("/donations/list", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM donations");
    res.json({ ok: true, donations: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.get("/donations/:userId", async (req, res) => {
  try {
    /* console.log(req.params); */
    const { userId } = req.params;
    const [rows] = await pool.query("SELECT * FROM donations WHERE user_agent = ? ORDER BY inserted_at DESC LIMIT 1", [userId]);
    console.log(rows);
    res.json({ ok: true, donations: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.get("/user/donations/:userId", async (req, res) => {
  try {
    /* console.log(req.params); */
    const { userId } = req.params;
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    console.log(rows);
    res.json({ ok: true, user: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

//GET http://localhost:3000/api/groups/list
r.get("/groups/list", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM `groups`");
    res.json({ ok: true, groups: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.get("/groups/mentor", async (_, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM `users` WHERE type = 'Mentor'");
    console.log(rows);
    res.json({ ok: true, mentor: rows });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});

r.get("/groups/total", async (_, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_groups,
          SUM(members) AS total_members,
          SUM(current_food_collection) AS total_food,
          SUM(current_money_collection) AS total_money
      FROM \`groups\`;`
    );
    res.json({ ok: true, groups: rows[0] });
  } catch (error) {
    res.status(500).json({ erro: error.message, db: "down" }); // Erro se não conseguir conectar
  }
});


r.put("/group/goals/:id", async (req, res) => {
  const { id } = req.params;
  const { newFoodGoal, newMoneyGoal } = req.body;

  // Validação: não pode ambos vazios
  if ((newFoodGoal === "" || newFoodGoal == null) && (newMoneyGoal === "" || newMoneyGoal == null)) {
    return res.status(400).json({ error: "Envie pelo menos uma meta válida" });
  }

  try {
    // Monta dinamicamente os campos
    const fields = [];
    const values = [];

    if (newFoodGoal !== "" && newFoodGoal != null) {
      fields.push("food_goal = ?");
      values.push(newFoodGoal);
    }

    if (newMoneyGoal !== "" && newMoneyGoal != null) {
      fields.push("monetary_target = ?");
      values.push(newMoneyGoal);
    }

    values.push(id); // para o WHERE

    const sql = `UPDATE \`groups\` SET ${fields.join(", ")} WHERE id = ?`;

    await pool.execute(sql, values);

    res.json({
      message: "Metas atualizadas com sucesso!",
      foodGoal: newFoodGoal ?? "não alterado",
      moneyGoal: newMoneyGoal ?? "não alterado"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


r.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM `groups` WHERE id = ?",
      [groupId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Grupo não encontrado" });
    }
    res.json(rows); // Retorna o usuário encontrado
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET http://localhost:3000/api/user/groups/:id (?)
r.get("/user/groups/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, created_at, current_money_collection, current_food_collection, status FROM users WHERE group_id = ?",
      [groupId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Grupo não encontrado" });
    }
    res.json(rows); // Retorna o usuário encontrado
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- IMAGEM ---------------- */

//POST - http://localhost:3000/api/images
//Body - form-data - key: image (File)
//Inserir Imagem
r.post("/images", upload.single("image"), async (req, res) => {
  try {
    const filepath = req.file.path;
    await pool.execute("INSERT INTO images (img) VALUES (?)", [filepath]);
    res
      .status(201)
      .json({ message: "Imagem enviada com sucesso!", img: filepath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

r.post("/analisar-extrato", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: fileBuffer.toString("base64"),
        },
      },
      {
        text: `Analise o extrato bancário e me diga:
        - Se parece legítimo ou fraudulento
        - Qual a probabilidade de fraude (0 a 1)
        - Motivo resumido`,
      },
    ]);

    const responseText = await result.response.text();

    // Parsing simples (ajuste conforme necessário)
    const legitimo = responseText.toLowerCase().includes("legítimo");
    const matchScore = responseText.match(/\d\.\d+/);
    const score = matchScore ? parseFloat(matchScore[0]) : 0.5;

    res.json({
      legitimo,
      score,
      resposta: responseText,
      nomeArquivo: req.file.originalname,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar o PDF" });
  }
});

// -----------------------------------------
// REGISTRO DE DOAÇÃO (comprovante)
// -----------------------------------------
r.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
r.post("/donations", upload.single("file"), async (req, res) => {
  try {
    const { idGroup, participanteId, tipo, quantidade, data, score } = req.body;
    console.log(req.body);

    if (!req.file) {
      return res.status(400).json({ error: "Arquivo é obrigatório" });
    }

    const filePath = req.file.path;
    console.log(req.file.path);
    /* console.log(req.file); */

    const [result] = await pool.execute(
      "INSERT INTO donations (id_group, type, quantity, user_agent, proof, inserted_at, score_fraud) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        idGroup,
        tipo,
        quantidade,
        participanteId,
        filePath,
        data,
        score || 0,
      ]
    );

    await pool.execute(
      `
      UPDATE users u
        LEFT JOIN (
          SELECT 
            user_agent,
            SUM(CASE WHEN type = 0 THEN quantity ELSE 0 END) AS total_food,
            SUM(CASE WHEN type = 1 THEN quantity ELSE 0 END) AS total_money
          FROM donations
          GROUP BY user_agent
        ) d ON u.id = d.user_agent
      SET 
        u.current_food_collection = IFNULL(d.total_food, 0),
        u.current_money_collection = IFNULL(d.total_money, 0)
      WHERE u.id = ?;
      `,
      [participanteId]
    );

    await pool.execute(
      `
        UPDATE \`groups\` g
        LEFT JOIN (
          SELECT 
            group_id,
            SUM(current_money_collection) AS total_money,
            SUM(current_food_collection) AS total_food
          FROM users
          GROUP BY group_id
        ) u ON g.id = u.group_id
        SET 
          g.current_money_collection = IFNULL(u.total_money, 0),
          g.current_food_collection = IFNULL(u.total_food, 0)
        WHERE
          g.id = 1;
      `
    )

    res.status(201).json({
      message: "Doação registrada com sucesso!",
      donationId: result.insertId,
      file: filePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

//GET - http://localhost:3000/api/images
//Retornar a lista com o ID e o caminho da imagem
//Listar Imagem
r.get("/images", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM images");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//PUT - http://localhost:3000/api/images/1
//Body - form-data - key: image (File)
//Atualizar Imagem

r.put("/images/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const newPath = req.file.path;

    const [old] = await pool.execute("SELECT * FROM images WHERE id = ?", [id]);
    if (old.length === 0)
      return res.status(404).json({ error: "Imagem não encontrada!" });

    const oldPath = old[0].img;

    await pool.execute("UPDATE images SET img = ? WHERE id = ?", [newPath, id]);

    fs.unlink(oldPath, (err) => {
      if (err) console.warn("Erro ao Remover:", err);
    });

    res.json({ message: "Imagem Atualizada com sucesso!", img: newPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//DELETE - http://localhost:3000/api/images/1
//Remove a imagem com o Id selecionado e do disco
//Deletar Imagem
r.delete("/images/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute("SELECT * FROM images WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Imagem não encontrada!" });
    const filePath = rows[0].img;
    await pool.execute("DELETE FROM images WHERE id =?", [id]);
    fs.unlink(filePath, (err) => {
      if (err) console.warn("Erro ao Remover:", err);
    });
    res.json({ message: "Imagem excluída com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default r;
