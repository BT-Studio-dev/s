/**
 * Development fallback driver.
 *
 * BT Panel targets MySQL in production. This module provides a drop-in,
 * mysql2-`Pool`-compatible object backed by Node 22's built-in SQLite engine
 * so the panel can boot (and the whole UI can be used) on machines or preview
 * sandboxes where no MySQL server is reachable.
 *
 * It is enabled only when `DATABASE_URL` uses the `sqlite:` / `file:` scheme,
 * or when `DB_FALLBACK=sqlite` and MySQL cannot be contacted. Production
 * deployments that point `DATABASE_URL` at a real MySQL never load this file.
 */
// `process.getBuiltinModule` reaches the Node built-ins directly at runtime.
// A static `import "node:sqlite"` is not resolvable by the bundler's externals
// shim, so this keeps the fallback loadable inside the Next server runtime.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
const { mkdirSync } = process.getBuiltinModule("node:fs");
const path = process.getBuiltinModule("node:path");

// ── MySQL → SQLite statement translation ───────────────────────────────────

const TYPE_MAP = [
  [/\bDATETIME\s*\(\s*\d+\s*\)/gi, "TEXT"],
  [/\bDATETIME\b/gi, "TEXT"],
  [/\bTIMESTAMP\s*\(\s*\d+\s*\)/gi, "TEXT"],
  [/\b(?:MEDIUM|LONG|TINY)TEXT\b/gi, "TEXT"],
  [/\bVARCHAR\s*\(\s*\d+\s*\)/gi, "TEXT"],
  [/\bCHAR\s*\(\s*\d+\s*\)/gi, "TEXT"],
  [/\bBOOLEAN\b/gi, "INTEGER"],
  [/\bTINYINT\s*\(\s*\d+\s*\)/gi, "INTEGER"],
  [/\b(?:BIG|SMALL|MEDIUM)INT\b/gi, "INTEGER"],
  [/\bDOUBLE\b/gi, "REAL"],
  [/\bJSON\b/gi, "TEXT"],
];

function translateDdl(statement) {
  let out = statement;

  // Table options MySQL requires and SQLite rejects.
  out = out.replace(/\s*ENGINE\s*=\s*\w+/gi, "");
  out = out.replace(/\s*DEFAULT\s+CHARSET\s*=\s*[\w]+/gi, "");
  out = out.replace(/\s*COLLATE\s*=\s*[\w]+/gi, "");
  out = out.replace(/\s*AUTO_INCREMENT\s*=\s*\d+/gi, "");

  // `INT NOT NULL AUTO_INCREMENT PRIMARY KEY` → SQLite rowid alias.
  out = out.replace(
    /\b(?:INT|INTEGER)\b(?:\s+UNSIGNED)?(?:\s+NOT\s+NULL)?\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi,
    "INTEGER PRIMARY KEY AUTOINCREMENT",
  );
  out = out.replace(/\s+AUTO_INCREMENT\b/gi, "");

  // Inline secondary indexes are not valid inside a SQLite CREATE TABLE.
  const indexes = [];
  const tableMatch = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/i.exec(out);
  const table = tableMatch ? tableMatch[1] : null;

  out = out.replace(
    /,?\s*UNIQUE\s+KEY\s+[`"]?(\w+)[`"]?\s*\(([^)]*)\)/gi,
    (_m, _name, cols) => `, UNIQUE (${cols})`,
  );
  out = out.replace(/,?\s*(?:KEY|INDEX)\s+[`"]?(\w+)[`"]?\s*\(([^)]*)\)/gi, (_m, name, cols) => {
    if (table) indexes.push(`CREATE INDEX IF NOT EXISTS ${name} ON ${table} (${cols})`);
    return "";
  });

  for (const [pattern, replacement] of TYPE_MAP) out = out.replace(pattern, replacement);

  out = out.replace(/CURRENT_TIMESTAMP\s*\(\s*\d+\s*\)/gi, "CURRENT_TIMESTAMP");
  out = out.replace(/DEFAULT\s+TRUE\b/gi, "DEFAULT 1");
  out = out.replace(/DEFAULT\s+FALSE\b/gi, "DEFAULT 0");

  // Tidy the comma noise left behind by the removals above.
  out = out.replace(/,(\s*,)+/g, ",");
  out = out.replace(/,\s*\)/g, "\n)");
  out = out.replace(/\(\s*,/g, "(");

  return { sql: out, indexes };
}

/** Split a comma-separated SQL fragment on top-level commas only. */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

/**
 * MySQL accepts the `default` keyword as a VALUES entry; SQLite does not.
 * Drop every column whose value is `default` in all rows so the table default
 * applies instead. Positional `?` parameters are unaffected because `default`
 * never consumes one.
 */
function rewriteDefaultValues(statement) {
  const head = /^(\s*insert\s+(?:or\s+\w+\s+)?into\s+[`"]?\w+[`"]?\s*)\(([^)]*)\)\s*values\s*/i.exec(
    statement,
  );
  if (!head) return statement;

  const prefix = head[1];
  const columns = splitTopLevel(head[2]).map((c) => c.trim());
  const rest = statement.slice(head[0].length);

  // Collect the parenthesised row tuples that follow VALUES.
  const tuples = [];
  let depth = 0;
  let start = -1;
  let quote = null;
  let end = rest.length;
  for (let i = 0; i < rest.length; i += 1) {
    const ch = rest[i];
    if (quote) {
      if (ch === quote && rest[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) tuples.push(rest.slice(start + 1, i));
    } else if (depth === 0 && /[a-z]/i.test(ch) && tuples.length) {
      end = i;
      break;
    }
  }
  if (!tuples.length) return statement;

  const rows = tuples.map((t) => splitTopLevel(t).map((v) => v.trim()));
  if (rows.some((r) => r.length !== columns.length)) return statement;

  const keep = columns
    .map((_c, index) => index)
    .filter((index) => !rows.every((row) => /^default$/i.test(row[index])));
  if (keep.length === columns.length) return statement;

  const suffix = rest.slice(end);
  const body = rows
    .map((row) => `(${keep.map((index) => (/^default$/i.test(row[index]) ? "NULL" : row[index])).join(", ")})`)
    .join(", ");

  if (!keep.length) {
    return `${prefix.trimEnd()} DEFAULT VALUES ${suffix}`.trim();
  }
  return `${prefix}(${keep.map((index) => columns[index]).join(", ")}) values ${body} ${suffix}`.trim();
}

function translateDml(statement) {
  let out = statement;

  if (/^\s*insert\s+/i.test(out) && /\bdefault\b/i.test(out)) out = rewriteDefaultValues(out);

  // MySQL's upsert idiom; SQLite needs the ON CONFLICT form.
  if (/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(out)) {
    out = out.replace(/\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+[\s\S]*$/i, " ON CONFLICT DO NOTHING");
  }

  // Row locking is a no-op on a single-writer embedded engine.
  out = out.replace(/\s+FOR\s+UPDATE\b/gi, "");
  out = out.replace(/\s+LOCK\s+IN\s+SHARE\s+MODE\b/gi, "");

  out = out.replace(/CURRENT_TIMESTAMP\s*\(\s*\d+\s*\)/gi, "CURRENT_TIMESTAMP");
  out = out.replace(/\bnow\s*\(\s*\d*\s*\)/gi, "CURRENT_TIMESTAMP");
  out = out.replace(/\bifnull\s*\(/gi, "ifnull(");
  out = out.replace(/\bconcat\s*\(([^()]*)\)/gi, (_m, args) =>
    args
      .split(",")
      .map((a) => a.trim())
      .join(" || "),
  );
  out = out.replace(/\brand\s*\(\s*\)/gi, "random()");

  // SQLite only accepts OFFSET after a LIMIT clause.
  if (/\boffset\b/i.test(out) && !/\blimit\b/i.test(out)) {
    out = out.replace(/\boffset\b/i, "limit -1 offset");
  }

  return out;
}

/**
 * drizzle consumes rows positionally (`rowsAsArray`), but node:sqlite only
 * returns objects — and a join that selects `sessions.id` plus `users.id`
 * collapses both onto one key. Alias every projected expression so each
 * column survives as a distinct, correctly ordered key.
 */
function aliasSelectList(statement) {
  if (!/^\s*select\b/i.test(statement)) return statement;

  const lower = statement.toLowerCase();
  let depth = 0;
  let quote = null;
  let fromIndex = -1;
  for (let i = 0; i < statement.length; i += 1) {
    const ch = statement[i];
    if (quote) {
      if (ch === quote && statement[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (depth === 0 && lower.startsWith("from", i) && /\s/.test(statement[i - 1] || "")) {
      fromIndex = i;
      break;
    }
  }
  if (fromIndex === -1) return statement;

  const head = /^\s*select\s+(distinct\s+)?/i.exec(statement);
  const listStart = head[0].length;
  const list = statement.slice(listStart, fromIndex);
  if (list.includes("*")) return statement;

  const projected = splitTopLevel(list);
  if (projected.length < 2) return statement;

  const aliased = projected.map((item, index) => {
    const expression = item.trim().replace(/\s+as\s+[`"']?\w+[`"']?$/i, "");
    return `${expression} as "c${index}"`;
  });

  return `${statement.slice(0, listStart)}${aliased.join(", ")} ${statement.slice(fromIndex)}`;
}

function isDdl(statement) {
  return /^\s*(CREATE|ALTER|DROP|TRUNCATE)\b/i.test(statement);
}

function translate(statement) {
  return isDdl(statement) ? translateDdl(statement) : { sql: translateDml(statement), indexes: [] };
}

// ── Value marshalling ──────────────────────────────────────────────────────

function toDriverValue(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 23).replace("T", " ");
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") {
    return value;
  }
  if (Buffer.isBuffer(value)) return value;
  return JSON.stringify(value);
}

function fromDriverValue(value) {
  return typeof value === "bigint" ? Number(value) : value;
}

// ── mysql2-compatible pool ─────────────────────────────────────────────────

function resolveFile(connectionString) {
  if (!connectionString) return ".bt-panel/dev.sqlite";
  const raw = connectionString.replace(/^sqlite:(\/\/)?/i, "").replace(/^file:(\/\/)?/i, "");
  if (!raw || raw === ":memory:") return ":memory:";
  return raw;
}

function createClient(sqlite) {
  const run = (statement, params = []) => {
    const text = typeof statement === "string" ? statement : statement.sql;
    const rowsAsArray = typeof statement === "object" && statement.rowsAsArray === true;
    const values = (Array.isArray(params) ? params : []).map(toDriverValue);
    let { sql: translated, indexes } = translate(text);
    if (rowsAsArray) translated = aliasSelectList(translated);

    const trimmed = translated.trim();
    if (!trimmed) return [[], []];

    const returnsRows = /^\s*(SELECT|PRAGMA|WITH)\b/i.test(trimmed);

    if (returnsRows) {
      const stmt = sqlite.prepare(trimmed);
      const rows = stmt.all(...values);
      if (!rowsAsArray) {
        return [rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, fromDriverValue(v)]))), []];
      }
      const columns = rows.length ? Object.keys(rows[0]) : [];
      return [rows.map((row) => columns.map((c) => fromDriverValue(row[c]))), []];
    }

    const result = sqlite.prepare(trimmed).run(...values);
    for (const index of indexes) sqlite.exec(index);

    return [
      {
        insertId: Number(result.lastInsertRowid ?? 0),
        affectedRows: Number(result.changes ?? 0),
        warningStatus: 0,
      },
      [],
    ];
  };

  const client = {
    query: async (statement, params) => run(statement, params),
    execute: async (statement, params) => run(statement, params),
    release: () => {},
    end: async () => sqlite.close(),
  };

  // drizzle treats a client with `getConnection` as a pool and uses it for
  // transactions; the returned connection shares this single SQLite handle.
  client.getConnection = async () => ({
    query: client.query,
    execute: client.execute,
    release: () => {},
    connection: client,
  });

  return client;
}

export function createSqlitePool(connectionString) {
  const file = resolveFile(connectionString);
  if (file !== ":memory:") mkdirSync(path.dirname(path.resolve(file)), { recursive: true });

  const sqlite = new DatabaseSync(file);
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");

  console.warn(
    `[bt-panel] MySQL is unavailable — using the SQLite development fallback at ${file}. ` +
      "Set DATABASE_URL to a real MySQL server for production.",
  );

  return createClient(sqlite);
}

export function isSqliteUrl(connectionString) {
  return typeof connectionString === "string" && /^(sqlite|file):/i.test(connectionString);
}
