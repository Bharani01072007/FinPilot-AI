import fs from "fs";
import path from "path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Auto-sync official FinPilot AI logo image to public/ and src/assets/ on Vite startup
try {
  const logoSrc = "C:\\Users\\Bharanidharan\\.gemini\\antigravity-ide\\brain\\f26e8112-9d65-4abf-9c5d-212721d67a55\\media__1786338972966.jpg";
  if (fs.existsSync(logoSrc)) {
    const rootDir = typeof import.meta.dirname !== "undefined" ? import.meta.dirname : path.resolve(".");
    const publicDir = path.resolve(rootDir, "public");
    const assetsDir = path.resolve(rootDir, "src/assets");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    ["favicon.png", "favicon.ico", "logo.png", "apple-touch-icon.png"].forEach((file) => {
      fs.copyFileSync(logoSrc, path.join(publicDir, file));
    });
    fs.copyFileSync(logoSrc, path.join(assetsDir, "logo.png"));
    console.log("[FinPilot AI] Favicon & Logo synchronized to public/ and src/assets/");
  }
} catch (e) {
  console.warn("Logo sync warning:", e);
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
