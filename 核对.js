const fs = require("fs");

function fail(message) {
  process.stdout.write(message + "\n");
  process.exit(1);
}

let content;
try {
  content = fs.readFileSync("清单", "utf8");
} catch (err) {
  if (err.code === "ENOENT") {
    process.stderr.write("找不到清单\n");
    process.exit(1);
  }
  throw err;
}

if (content.length === 0) {
  process.stderr.write("清单不对\n");
  process.exit(1);
}

const rawLines = content.split("\n");
if (rawLines.length > 0 && rawLines[rawLines.length - 1] === "") {
  rawLines.pop();
}

const entries = [];
const seen = new Set();

for (const rawLine of rawLines) {
  const match = /^([^ ]+) ([0-9]+)$/.exec(rawLine);
  if (match === null) {
    process.stderr.write("清单不对\n");
    process.exit(1);
  }

  const path = match[1];
  const expectedLines = Number(match[2]);

  if (path === "" || path.startsWith("/") || path.startsWith("./")) {
    process.stderr.write("清单不对\n");
    process.exit(1);
  }

  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    process.stderr.write("清单不对\n");
    process.exit(1);
  }

  if (!Number.isInteger(expectedLines) || expectedLines < 1) {
    process.stderr.write("清单不对\n");
    process.exit(1);
  }

  if (seen.has(path)) {
    process.stderr.write("清单不对\n");
    process.exit(1);
  }
  seen.add(path);

  entries.push({ path, expectedLines });
}

for (const entry of entries) {
  let stat;
  try {
    stat = fs.statSync(entry.path);
  } catch (err) {
    fail("核对不过");
  }

  if (stat.isDirectory()) {
    fail("核对不过");
  }

  let buffer;
  try {
    buffer = fs.readFileSync(entry.path);
  } catch (err) {
    fail("核对不过");
  }

  if (buffer.length === 0) {
    fail("核对不过");
  }

  let lineCount = 0;
  for (const byte of buffer) {
    if (byte === 10) {
      lineCount += 1;
    }
  }
  if (buffer[buffer.length - 1] !== 10) {
    lineCount += 1;
  }

  if (lineCount !== entry.expectedLines) {
    fail("核对不过");
  }
}

process.stdout.write("核对通过\n");
process.exit(0);
