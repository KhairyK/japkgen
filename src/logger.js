const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";

function color(code, text) {
  return `${code}${text}${RESET}`;
}

function stripAnsi(input) {
  return String(input).replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function padVisible(text, width) {
  return width - stripAnsi(text).length;
}

function line(char = "─", width = 72) {
  return char.repeat(width);
}

function block(title, details = []) {
  const width = 72;
  const titleLine = ` ${title} `;
  const left = Math.max(0, Math.floor((width - titleLine.length) / 2));
  const right = Math.max(0, width - titleLine.length - left);
  const out = [
    color(CYAN, "┌" + "─".repeat(left) + titleLine + "─".repeat(right) + "┐"),
  ];
  for (const item of details)
    out.push(color(CYAN, `│ ${item.padEnd(width - 2)}│`));
  out.push(color(CYAN, "└" + "─".repeat(width) + "┘"));
  return out.join("\n");
}

export const logger = {
  title(text) {
    console.log(color(BOLD + CYAN, `\n◆ ${text}`));
  },
  section(text) {
    console.log(color(BOLD + BLUE, `\n▶ ${text}`));
  },
  info(text) {
    console.log(color(CYAN, `ℹ ${text}`));
  },
  success(text) {
    console.log(color(GREEN, `✔ ${text}`));
  },
  warn(text) {
    console.log(color(YELLOW, `⚠ ${text}`));
  },
  error(text) {
    console.error(color(RED, `✖ ${text}`));
  },
  dim(text) {
    console.log(color(DIM, text));
  },
  bullet(label, value) {
    console.log(`${color(MAGENTA, "•")} ${label}: ${value}`);
  },
  plain(text = "") {
    console.log(text);
  },
  note(text) {
    console.log(color(DIM, `  ${text}`));
  },
  box(title, details = []) {
    console.log(block(title, details));
  },
  line,
  color,
  colors: { RESET, BOLD, DIM, RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN },
  stripAnsi,
};
