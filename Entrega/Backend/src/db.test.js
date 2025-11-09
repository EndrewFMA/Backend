
import 'dotenv/config'
import mysql from 'mysql2/promise'

// Extrai variáveis do .env
const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB } = process.env

// Função para testar conexão com o banco
const testConnection = async () => {
    try {
        const conn = await mysql.createConnection({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DB
        })
        const [rows] = await conn.query('SELECT NOW() AS agora')
        console.log('Conectado ao MySQL - Data/Hora:', rows[0].agora)
        await conn.end()
    } catch (err) {
        console.error('Erro ao conectar no MySQL:', err.message)
    }
}
