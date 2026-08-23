import { createSerwistRoute } from "@serwist/turbopack";
import { serverEnv } from "@/server/env-server";

const revision =
  serverEnv.VERCEL_GIT_COMMIT_SHA ||
  serverEnv.BUILD_ID ||
  process.env.npm_package_version ||
  "1.0.0";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
