import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://mhws-artia-skill-optimizer.vercel.app/sitemap.xml",
  };
}
