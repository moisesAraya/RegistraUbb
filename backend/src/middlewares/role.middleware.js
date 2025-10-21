export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'No autenticado' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: 'No autorizado' });
  next();
};