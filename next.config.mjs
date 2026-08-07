/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Самодостаточная сборка для Docker: .next/standalone содержит server.js
  // и урезанный node_modules (см. docker/Dockerfile).
  output: "standalone",
  // Эти пакеты тяжёлые и должны исполняться в Node, а не бандлиться сборщиком.
  // С Next 15 ключ стабилизирован и переехал из experimental на верхний уровень.
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  // Внутренний инструмент: запрет индексации на всё, что отдаёт сервер —
  // страницы, статику и выгрузки из /api (PDF/Excel, куда meta не положить).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
