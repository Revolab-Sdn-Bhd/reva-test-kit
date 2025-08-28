const createNextPluginPreval = require("next-plugin-preval/config");
const withNextPluginPreval = createNextPluginPreval();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  publicRuntimeConfig: {
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    AI_HANDLER_URL: process.env.AI_HANDLER_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  },
};

module.exports = withNextPluginPreval(nextConfig);
