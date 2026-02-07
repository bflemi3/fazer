import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwist from "@serwist/next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

const isDev = process.env.NODE_ENV === "development";

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
})(withNextIntl(nextConfig));
