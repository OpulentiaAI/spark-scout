/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Avoid build failures due to ESLint plugin issues in CI
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
