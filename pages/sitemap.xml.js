import { getAllPublicRoutes, SITE_URL } from "@/utils/sitemap";

export async function getServerSideProps({ res }) {
  const routes = await getAllPublicRoutes();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `<url>
  <loc>${SITE_URL}${r.loc}</loc>
  <changefreq>weekly</changefreq>
  <priority>${r.loc === "/" ? "1.0" : "0.7"}</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null;
}
