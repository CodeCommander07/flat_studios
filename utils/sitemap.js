export const SITE_URL = "https://yapton.flatstudios.net";

export async function getAllPublicRoutes() {
  const fs = await import("fs");
  const path = await import("path");

  const pagesDir = path.join(process.cwd(), "pages");

  // ✅ filenames to ignore
  const EXCLUDE = [
    "api",
    "_app",
    "_document",
    "_error",
    "404",
    "500",
    "sitemap",
    "sitemap.xml"
  ];

  function scan(dir, base = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const out = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        out.push(...scan(fullPath, `${base}/${entry.name}`));
        continue;
      }

      if (!entry.name.match(/\.(js|jsx|ts|tsx)$/)) continue;

      const name = entry.name.replace(/\.(js|jsx|ts|tsx)$/, "");

      if (EXCLUDE.includes(name)) continue;

      // ✅ remove dynamic routes
      if (name.includes("[") || base.includes("[")) continue;

      let route =
        name === "index"
          ? base
          : `${base}/${name}`;

      route = route.replace(/\/+/g, "/");

      out.push({
        loc: route,
        label: prettify(route),
        section: sectionFromRoute(route),
        lastmod: null
      });
    }

    return out;
  }

  return scan(pagesDir);
}

function prettify(route) {
  if (route === "/") return "Home";
  return route
    .replace(/\//g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function sectionFromRoute(route) {
  const first = route.split("/")[1];
  if (!first) return "General";
  return first.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
