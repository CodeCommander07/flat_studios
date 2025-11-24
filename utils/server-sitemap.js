// utils/server-sitemap.js

export async function getStaticRoutes() {
  const fs = await import('fs');
  const path = await import('path');

  const pagesDir = path.join(process.cwd(), 'pages');
  const PRIVATE_PREFIXES = ['/admin', '/hub', '/me', '/api'];
  const EXCLUDE_FILES = ['_app', '_document', '_error'];

  function scan(dir, baseRoute = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const routes = [];

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'api') continue;
        routes.push(...scan(full, path.join(baseRoute, entry.name)));
        continue;
      }

      if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;

      const name = entry.name.replace(/\.(js|jsx|ts|tsx)$/, '');
      if (EXCLUDE_FILES.includes(name)) continue;

      let route =
        name === 'index'
          ? baseRoute
          : path.join(baseRoute, name);

      route = '/' + route.replace(/\\/g, '/').replace(/^\/+/, '');

      if (route.includes('[')) continue;
      if (PRIVATE_PREFIXES.some(p => route.startsWith(p))) continue;

      routes.push({
        loc: route || '/',
        lastmod: new Date().toISOString()
      });
    }

    return routes;
  }

  return scan(pagesDir);
}
