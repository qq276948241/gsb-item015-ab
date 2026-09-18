const fs = require("fs");

function badManifest() {
  process.stderr.write("清单不对\n");
  process.exit(1);
}

function notPassed() {
  process.stdout.write("核对不过\n");
  process.exit(1);
}

let manifest;
try {
  manifest = fs.readFileSync("清单");
} catch (err) {
  if (err.code === "ENOENT") {
    process.stderr.write("找不到清单\n");
    process.exit(1);
  }
  throw err;
}

if (manifest.length === 0) badManifest();

const lines = [];
let lineStart = 0;
for (let i = 0; i < manifest.length; i++) {
  if (manifest[i] === 10) {
    lines.push(manifest.slice(lineStart, i).toString("utf8"));
    lineStart = i + 1;
  }
}
if (lineStart < manifest.length) {
  lines.push(manifest.slice(lineStart).toString("utf8"));
}

const seen = new Set();
const entries = [];

for (const line of lines) {
  const parts = line.split(" ");
  if (parts.length !== 2) badManifest();
  const relPath = parts[0];
  const countText = parts[1];

  if (relPath === "") badManifest();
  if (!/^[1-9][0-9]*$/.test(countText)) badManifest();
  if (relPath.charAt(0) === "/") badManifest();
  if (relPath === "." || relPath.charAt(0) === "." && relPath.charAt(1) === "/") badManifest();

  const segments = relPath.split("/");
  if (segments.indexOf("..") !== -1) badManifest();
  if (seen.has(relPath)) badManifest();
  seen.add(relPath);

  entries.push({ relPath, expected: Number(countText) });
}

for (const entry of entries) {
  let stat;
  try {
    stat = fs.statSync(entry.relPath);
  } catch (err) {
    notPassed();
  }
  if (stat.isDirectory()) notPassed();

  let buf;
  try {
    buf = fs.readFileSync(entry.relPath);
  } catch (err) {
    notPassed();
  }

  let actual = 0;
  if (buf.length > 0) {
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 10) actual++;
    }
    if (buf[buf.length - 1] !== 10) actual++;
  }

  if (actual !== entry.expected) notPassed();
}

process.stdout.write("核对通过\n");
