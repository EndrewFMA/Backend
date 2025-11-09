import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createToken, denyToken } from "../services/tokenService.js";

const sanitizeUser = (u) => ({ id: u.id, name: u.name, email: u.email });

export const register = async (req, res) => {
  const { name, email, password, type } = req.body; // <-- pegar type
  if (!name || !email || !password || !type) {
    return res
      .status(400)
      .json({ error: "Envie name, email, password e type" });
  }

  try {
    const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (exists.length)
      return res.status(409).json({ error: "E-mail já cadastrado" });

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, `type`) VALUES (?, ?, ?, ?)",
      [name, email, hashed, type] // <-- incluir type aqui
    );

    return res.status(201).json({ id: result.insertId, name, email, type });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: err });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute(`
      SELECT 
          users.id,
          users.group_id,
          users.password,
          users.email,
          users.name,
          users.type,
          users.current_food_collection,
          users.current_money_collection,
          users.status as status_user,
          gp.name as group_name,
          gp.monetary_target,
          gp.food_goal,
          gp.current_food_collection,
          gp.current_money_collection
      FROM
          users
      INNER JOIN 
          \`groups\` as gp on users.group_id = gp.id
      WHERE 
        users.email = ? AND 
        users.status = 1;`, 
        [email]);

    console.log("rows:", rows);
    if (rows.length === 0)
      return res.status(401).json({ error: "Usuário não encontrado" });

    const user = rows[0];

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ error: "Senha inválida" });

    // Cria token JWT
    const { token, jti } = createToken({
      id: user.id,
      email: user.email,
      type: user.type,
    });

    // Retorna o user corretamente
    return res.json({
      jti,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        currentFoodCollection: user.current_food_collection,
        currentMoneyCollection: user.current_money_collection,
      },
      group:{
        idGroup: user.group_id,
        currentFoodCollection: user.curr_gp_food_coll,
        currentMoneyCollection: user.curr_gp_money_coll,
        monetaryTarget: user.monetary_target,
        foodGoal: user.food_goal,
        groupName: user.group_name,
      }
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro no login" });
  }
};

// Logout: revoga o token atual (via jti em denylist)
export const logout = async (req, res) => {
  try {
    const { jti } = req.user;
    denyToken(jti);
    return res.json({ message: "Logout realizado com sucesso" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ error: "Erro no logout" });
  }
};

// =================== ESQUECEU A SENHA ===================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Envie o e-mail" });

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res.json({
        message: "Se o e-mail existir, enviaremos um link de recuperação.",
      });

    const user = users[0];

    // Cria token temporário
    const jwt = await import("jsonwebtoken");
    const token = jwt.default.sign(
      { email: user.email },
      process.env.JWT_SECRET || "segredo_local",
      { expiresIn: "15m" }
    );
    //console.log(token);
    const link = `http://localhost:5173/reset-password/${token}`; // frontend local
    console.log(link);
    // 🚀 Retorna o link diretamente para você testar
    return res.json({
      message: "Link de redefinição gerado com sucesso!",
      resetLink: link,
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ error: "Erro ao gerar link de recuperação" });
  }
};  

// =================== REDEFINIR SENHA ===================
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashed = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      hashed,
      decoded.email,
    ]);

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(400).json({ error: "Token inválido ou expirado." });
  }
};
