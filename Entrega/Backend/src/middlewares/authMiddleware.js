// src/middlewares/authMiddleware.js
import { verifyToken as verifyJwt } from '../services/tokenService.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    console.log(req.headers);
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return res
        .status(401)
        .json({ error: 'Token necessário (Authorization: Bearer <token>)' });
    }

    // Decodifica e valida assinatura/expiração e denylist
    const decoded = await verifyJwt(token); // esperado: { id, email, jti, iat, exp }

    // Tolerante a variações (id, sub, user.id)
    const userId =
      decoded?.id ??
      (decoded?.sub ? Number(decoded.sub) : undefined) ??
      decoded?.user?.id;

    if (!userId) {
      console.error('Auth: payload sem id. decoded =', decoded);
      return res.status(401).json({ error: 'Token sem identificação de usuário' });
    }

    req.user = {
      id: userId,
      email: decoded?.email,
      jti: decoded?.jti,
    };

    return next();
  } catch (err) {
    console.error('Auth error:', err?.message);
    // Use 401 para qualquer falha de autenticação/validação
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};