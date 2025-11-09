import db from "../db.js";
import bcrypt from "bcrypt";

export const profile = async (req, res) => {
  try {
  const [rows] = await db.query(
  'SELECT id, name, email, created_at FROM users WHERE id = ?',
  [req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json(rows[0])
    } catch (err) {
    console.error('profile error:', err)
    return res.status(500).json({ error: 'Erro ao buscar perfil' })
  }
}


// Atualizar usuário (sem alterar e-mail). Permite name e/ou password.
export const updateMe = async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  if (!name && !newPassword) {
    return res
      .status(400)
      .json({ error: "Envie ao menos name ou newPassword" });
  }
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Usuário não encontrado" });
    const user = rows[0];
    const updates = [];
    const params = [];
    if (name) {
      updates.push("name = ?");
      params.push(name);
    }
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "Envie currentPassword para trocar a senha" });
      }
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push("password = ?");
      params.push(hashed);
    }
    if (!updates.length) {
      return res.status(400).json({ error: "Nada para atualizar" });
    }
    params.push(req.user.id);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(sql, params);
    const [fresh] = await db.query(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    return res.json(fresh[0]);
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id, 10) !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Você só pode deletar a sua própria conta" });
  }
  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ message: "Conta deletada com sucesso" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ error: "Erro ao deletar usuário" });
  }
};
