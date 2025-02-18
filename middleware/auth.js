const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin';

function requireAuth(req, res, next) {
  const session = req.session;
  if (session && session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
}

module.exports = { requireAuth, DASHBOARD_PASSWORD }; 