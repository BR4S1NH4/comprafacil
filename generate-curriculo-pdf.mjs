import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, "curriculo-tiago.html");
const outputPath = path.join(__dirname, "curriculo-tiago.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({
  path: outputPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

await browser.close();

console.log(`PDF gerado em: ${outputPath}`);
