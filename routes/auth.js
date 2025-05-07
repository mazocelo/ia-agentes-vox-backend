var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'chave_refresh';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Fake users
const users = [
  { id: 1, username: 'admin@admin', password: '123', role: 'admin', org: 1 },
  { id: 2, username: 'user@user', password: '456', role: 'user', org: 1 },
];

// Em memória
const refreshTokens = new Set();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});// routes/auth.js


// Geração de tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role, org: user.org }, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

  refreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
};

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

  const { accessToken, refreshToken } = generateTokens(user);
  res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, role: user.role } });
});

// Refresh Token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(403).json({ message: 'Refresh token inválido ou expirado' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);

    refreshTokens.delete(refreshToken);
    refreshTokens.add(newRefresh);

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(403).json({ message: 'Refresh token inválido ou expirado' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  refreshTokens.delete(refreshToken);
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;
