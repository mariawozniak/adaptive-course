import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Railway podaje port w zmiennej środowiskowej PORT
const PORT = process.env.PORT || 3000;

// Potrzebne w ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serwowanie plików frontendu z /public
app.use(express.static(path.join(__dirname, "public")));

// Proste API testowe
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend działa ✅",
    time: new Date().toISOString()
  });
});

// Dla bezpieczeństwa: każde inne wejście kieruj na index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
