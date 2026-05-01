import type { MetadataRoute } from "next";
import { SITE } from "@/content/copy";

const routes = [
  "",
  "/story",
  "/product",
  "/pricing",
  "/waitlist",
  "/legal/terms",
  "/legal/privacy",
  "/legal/data-use",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: new Date("2026-04-29"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
