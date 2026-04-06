function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
}

function requireAuthSocket(socket, next) {
  const session = socket.request.session;
  if (!session || !session.userId) {
    return next(new Error('인증이 필요합니다'));
  }
  next();
}

module.exports = { requireAuth, requireAuthSocket };
