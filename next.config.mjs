/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Эти пакеты тяжёлые и должны исполняться в Node, а не бандлиться сборщиком.
  // С Next 15 ключ стабилизирован и переехал из experimental на верхний уровень.
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
};

export default nextConfig;
