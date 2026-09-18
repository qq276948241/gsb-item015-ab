const fs = require("fs");
const text = fs.readFileSync("口令", "utf8").replace(/\n$/, "");
if (text === "今晚") {
  process.stdout.write("开门\n");
} else {
  process.stdout.write("不开\n");
  process.exit(2);
}
