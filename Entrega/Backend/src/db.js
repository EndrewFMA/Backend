import "dotenv/config"; // Carrega variáveis do .env
import mysql from "mysql2/promise"; // Importa MySQL com suporte a Promises

// Cria um pool de conexões com o banco de dados

export const pool = await mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DB || "auria",
  waitForConnections: true,
  connectionLimit: 10,
});

/* console.log("Usuário:", process.env.MYSQL_USER);
console.log("Senha:", process.env.MYSQL_PASSWORD); */

export default pool;
