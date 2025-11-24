// pages/sitemap.js
import fs from "fs";
import path from "path";
import Link from "next/link";

function scanPages(dir, base = "") {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  let routes = [];

  for (const file of files) {
    const full = path.join(dir, file.name);

    // ✅ skip node_modules etc
    if (file.name.startsWith(".")) continue;

    // ✅ skip API routes
    if (base.startsWith("/api")) continue;

    if (file.isDirectory()) {
      // ✅ skip dynamic folders ONLY, still allow static inside
      if (/^\[.*\]$/.test(file.name)) continue;

      routes = routes.concat(scanPages(full, base + "/" + file.name));
      continue;
    }

    // ✅ include .js .jsx .tsx
    if (!/\.(js|jsx|tsx)$/.test(file.name)) continue;

    // ✅ skip Next.js system files
    if (
      file.name.startsWith("_") ||
      file.name === "404.js" ||
      file.name === "500.js"
    ) continue;

    // ✅ create route path
    let route =
      base + "/" + file.name.replace(/(index)?\.(js|jsx|tsx)$/, "");

    route = route.replace(/\/+/g, "/");

    if (route === "/") route = "/";

    routes.push({
      loc: route,
      label: route === "/" ? "Home" : route.replace("/", "").replace("-", " "),
      section: base.split("/")[1] || "General",
    });
  }

  return routes;
}


export async function getStaticProps() {
  const pagesDir = path.join(process.cwd(), "pages");
  const routes = scanPages(pagesDir);

  // group by section
  const sections = routes.reduce((acc, r) => {
    const key = r.section || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return {
    props: {
      sections,
      generatedAt: new Date().toISOString()
    }
  };
}

export default function HumanSitemap({ sections, generatedAt }) {
  return (
    <main className="text-white px-4 md:px-8 py-10 bg-[#1b2224] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-white/10 pb-4">
          <h1 className="text-3xl font-bold">Yapton & District – Sitemap</h1>
          <p className="text-xs text-white/40">
            Generated: {new Date(generatedAt).toLocaleString("en-GB")}
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(sections).map(([section, pages]) => (
            <section
              key={section}
              className="bg-[#283335] border border-white/10 rounded-2xl p-4"
            >
              <h2 className="text-lg font-semibold mb-3">
                {section} ({pages.length})
              </h2>

              <ul className="space-y-1 max-h-72 overflow-y-auto pr-1 text-sm">
                {pages.map(p => (
                  <li key={p.loc}>
                    <Link
                      href={p.loc}
                      className="text-blue-300 hover:underline break-all"
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
