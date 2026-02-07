import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwist from "@serwist/next";
import crypto from "node:crypto";
import fs from "node:fs";

const withNextIntl = createNextIntlPlugin();

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const appVersion: string = pkg.version;

function parseReleaseNotes(version: string): string {
  const changelog = fs.readFileSync("./CHANGELOG.md", "utf-8");
  const heading = `## v${version}`;
  const start = changelog.indexOf(heading);
  if (start === -1) return "";
  const afterHeading = changelog.indexOf("\n", start) + 1;
  const nextSection = changelog.indexOf("\n## ", afterHeading);
  const section =
    nextSection === -1
      ? changelog.slice(afterHeading)
      : changelog.slice(afterHeading, nextSection);
  return section.trim();
}

const releaseNotes = parseReleaseNotes(appVersion);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_RELEASE_NOTES: releaseNotes,
  },
};

const isDev = process.env.NODE_ENV === "development";

const revision = crypto.randomUUID();

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
})(withNextIntl(nextConfig));
