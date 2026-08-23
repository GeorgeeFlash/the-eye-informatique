import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import { serverEnv } from "@/server/env-server";

// A revision helps Serwist version precached pages to avoid stale responses.
// Prefer a stable build-time identifier so the revision is consistent across
// all instances of a cold start (randomUUID would bust the cache on every restart).
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  serverEnv.VERCEL_GIT_COMMIT_SHA ||
  serverEnv.BUILD_ID ||
  // Last resort for local dev only: a random UUID will bust the cache on each restart
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
