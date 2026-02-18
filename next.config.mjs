/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://the99community.vercel.app/sports/tennis",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
