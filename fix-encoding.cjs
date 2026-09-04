const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "src");

const replacements = {
  "ðŸ””": "🔔",
  "ðŸ‘‹": "👋",
  "âŒ‚": "⌂",
  "â–¶": "▶",
  "âœ‰": "✉",
  "â†—": "↗",
  "â™¢": "♣",
  "â˜°": "☰",
  "âš™": "⚙",
  "â†ª": "↪",
  "â†’": "→",
  "â†": "←",
  "â‚¹": "₹",
  "Ã—": "×",
  "â€”": "—",
  "â˜€": "☀",
  "â˜¾": "☾",
  "â—ˆ": "◈",
  "â—’": "◒",
  "âŒ": "❌"
};

const extensions = new Set([
  ".jsx",
  ".js",
  ".html",
  ".css"
]);

let changedFiles = 0;
let replacementsCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!extensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    let text = fs.readFileSync(fullPath, "utf8");
    const original = text;

    for (const [bad, good] of Object.entries(replacements)) {
      const count = text.split(bad).length - 1;

      if (count > 0) {
        text = text.split(bad).join(good);
        replacementsCount += count;
      }
    }

    if (text !== original) {
      fs.writeFileSync(fullPath, text, "utf8");
      changedFiles++;
      console.log("Fixed:", path.relative(process.cwd(), fullPath));
    }
  }
}

walk(root);

console.log("");
console.log("Finished.");
console.log("Files fixed:", changedFiles);
console.log("Characters repaired:", replacementsCount);