import { spawnSync } from "node:child_process";
import { basename } from "node:path";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
  if (result.error || result.status !== 0) {
    fail(
      "Secret check failed: Git or git-secrets could not complete the check.",
    );
  }
  return result.stdout;
}

git(["secrets", "--list"]);

const patterns = [
  "(AKIA|ASIA)[A-Z0-9]{16}",
  "(ghp_|github_pat_|sk-proj-)[A-Za-z0-9_-]{20,}",
  "-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----",
  String.raw`^[[:space:]]*(export[[:space:]]+)?(SPOONACULAR_API_KEY|MYSQL_PASSWORD|MYSQL_ROOT_PASSWORD|DATABASE_URL)[[:space:]]*=[[:space:]]*["']?[A-Za-z0-9][^[:space:]"',;]{3,}`,
  String.raw`(SPOONACULAR_API_KEY|MYSQL_PASSWORD|MYSQL_ROOT_PASSWORD|DATABASE_URL|apiKey|api_key|password|secret|token)["']?[[:space:]]*[:=][[:space:]]*["'][^$"'[:space:]][^"']{2,}["']`,
  String.raw`(mysql|postgres|postgresql)://[^[:space:]:/]+:[^$[:space:]@]+@`,
];
const config = patterns.flatMap((pattern) => [
  "-c",
  `secrets.patterns=${pattern}`,
]);
const placeholders = new Set(
  [
    ["SPOONACULAR_API_KEY", "your_key_here"],
    ["MYSQL_PASSWORD", "replace_with_local_database_password"],
    ["MYSQL_ROOT_PASSWORD", "replace_with_local_root_password"],
  ].map(([key, value]) => `${key}=${value}`),
);
const files = git([
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMRT",
  "-z",
])
  .split("\0")
  .filter(Boolean);

for (const file of files) {
  const name = basename(file);
  if (
    name === ".env" ||
    (name.startsWith(".env.") && name !== ".env.example")
  ) {
    fail(`Commit blocked: environment file staged: ${file}`);
  }
  let contents = git(["show", `:${file}`]);
  // Like git-secrets' grep -I, scan text rather than binary assets.
  if (contents.includes("\0")) continue;
  if (name === ".env.example") {
    contents = contents
      .split("\n")
      .map((line) => (placeholders.has(line.trim()) ? "" : line))
      .join("\n");
  }
  const result = spawnSync("git", [...config, "secrets", "--scan", "-"], {
    input: contents,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) {
    fail(
      `Commit blocked: possible secret or scanner failure in ${file}. Review locally; do not bypass the hook.`,
    );
  }
}
console.log("Secret check passed.");
