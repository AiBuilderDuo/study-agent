export function authMiddleware(req, res, next) {
  const required = process.env.APP_PASSWORD;
  if (!required) return next(); // auth disabilitata se APP_PASSWORD non e' settata

  // Permetti asset statici e login
  if (req.path === "/login" || req.path === "/login.html" || req.path === "/api/login" || req.path.startsWith("/style.css")) {
    return next();
  }

  const token = req.headers["x-app-token"] || req.cookies?.app_token || req.query.token;
  if (token && token === required) return next();

  // Se richiesta API, 401; se pagina, redirect login
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.redirect("/login.html");
}
