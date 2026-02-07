import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwist from "@serwist/next";
import crypto from "node:crypto";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

const isDev = process.env.NODE_ENV === "development";

const revision = crypto.randomUUID();

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
})(withNextIntl(nextConfig));
