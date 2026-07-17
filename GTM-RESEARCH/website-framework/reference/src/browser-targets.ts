export type BrowserTier = 0 | 1 | 2 | 3 | 4;
export type BrowserConfigSource = "package.json" | ".browserslistrc" | "vite" | "next" | "astro" | "default";

export interface BrowserConfigurationInput {
  packageJsonText?: string;
  browserslistRcText?: string;
  frameworkConfigs?: Partial<Record<"vite" | "next" | "astro", string>>;
}

export interface BrowserVersionFloor {
  chrome?: number;
  edge?: number;
  firefox?: number;
  safari?: number;
  iosSafari?: number;
}

export interface BrowserTargetReport {
  source: BrowserConfigSource;
  queries: string[];
  tier: BrowserTier;
  explicit: boolean;
  floors: BrowserVersionFloor;
  rationale: string[];
  reportId: string;
}

export const AMTECH_TIER_2_QUERIES = [
  "Chrome >= 111",
  "Edge >= 111",
  "Firefox >= 113",
  "Safari >= 16.4",
  "ios_saf >= 16.4",
  "not dead",
  "not op_mini all",
] as const;

export function resolveBrowserTargets(input: BrowserConfigurationInput): BrowserTargetReport {
  const packageQueries = readPackageQueries(input.packageJsonText);
  if (packageQueries.length > 0) return buildReport("package.json", packageQueries, true);

  const rcQueries = readRcQueries(input.browserslistRcText);
  if (rcQueries.length > 0) return buildReport(".browserslistrc", rcQueries, true);

  for (const framework of ["vite", "next", "astro"] as const) {
    const config = input.frameworkConfigs?.[framework];
    if (!config) continue;
    const queries = extractFrameworkQueries(config);
    if (queries.length > 0) return buildReport(framework, queries, true);
  }

  return buildReport("default", [...AMTECH_TIER_2_QUERIES], false, [
    "No browser configuration was found; the framework selected its conservative-modern Tier 2 baseline.",
  ]);
}

export function assertAmtechBrowserBaseline(report: BrowserTargetReport): void {
  if (report.tier > 2) throw new Error(`AMTECH UI requires Tier 2 or newer; resolved Tier ${report.tier}`);
  const floors = report.floors;
  if ((floors.chrome ?? 0) < 111) throw new Error("Chrome floor must be at least 111");
  if ((floors.edge ?? 0) < 111) throw new Error("Edge floor must be at least 111");
  if ((floors.firefox ?? 0) < 113) throw new Error("Firefox floor must be at least 113");
  if ((floors.safari ?? 0) < 16.4) throw new Error("Safari floor must be at least 16.4");
  if ((floors.iosSafari ?? 0) < 16.4) throw new Error("iOS Safari floor must be at least 16.4");
}

function buildReport(
  source: BrowserConfigSource,
  queries: string[],
  explicit: boolean,
  extraRationale: string[] = [],
): BrowserTargetReport {
  const normalized = queries.map((query) => query.trim()).filter(Boolean);
  const floors = extractFloors(normalized);
  const tier = inferTier(normalized, floors);
  const rationale = [
    ...extraRationale,
    `Resolved ${normalized.length} browser queries from ${source}.`,
    `Mapped targets to Tier ${tier}.`,
  ];
  return {
    source,
    queries: normalized,
    tier,
    explicit,
    floors,
    rationale,
    reportId: stableId(`${source}\0${normalized.join("\0")}\0${tier}`),
  };
}

function readPackageQueries(text?: string): string[] {
  if (!text?.trim()) return [];
  try {
    const parsed = JSON.parse(text) as { browserslist?: string[] | Record<string, string[]> | string };
    const value = parsed.browserslist;
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
    if (value && typeof value === "object") {
      const production = value.production ?? value.defaults ?? Object.values(value)[0];
      return Array.isArray(production) ? production.filter((item): item is string => typeof item === "string") : [];
    }
  } catch {
    throw new Error("package.json is not valid JSON while resolving browserslist");
  }
  return [];
}

function readRcQueries(text?: string): string[] {
  if (!text?.trim()) return [];
  return text.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim()).filter(Boolean);
}

function extractFrameworkQueries(text: string): string[] {
  const matches = [...text.matchAll(/(?:build\.target|target|browserslist)\s*[:=]\s*["'`]([^"'`]+)["'`]/g)];
  return matches.map((match) => match[1]).filter(Boolean);
}

function inferTier(queries: readonly string[], floors: BrowserVersionFloor): BrowserTier {
  const joined = queries.join(" ").toLowerCase();
  if (/\bie\s*(?:11|>=|>|$)|ie_mob|android\s*(?:[1-4](?:\.|\s|$))/.test(joined)) return 4;
  if (/safari\s*(?:<=?\s*15|15(?:\.|\s|$))|>\s*1%/.test(joined)) return 3;
  if (meetsFloors(floors, { chrome: 125, edge: 125, firefox: 128, safari: 17.5, iosSafari: 17.5 })) return 1;
  if (meetsFloors(floors, { chrome: 111, edge: 111, firefox: 113, safari: 16.4, iosSafari: 16.4 })) return 2;
  if (/latest|last\s+[12]\s+/.test(joined) && !/>\s*1%/.test(joined)) return 1;
  if (/experimental|canary|technology preview/.test(joined)) return 0;
  return 3;
}

function extractFloors(queries: readonly string[]): BrowserVersionFloor {
  const floors: BrowserVersionFloor = {};
  for (const query of queries) {
    const match = query.match(/^\s*(chrome|edge|firefox|safari|ios_saf|ios)\s*>=\s*(\d+(?:\.\d+)?)/i);
    if (!match) continue;
    const version = Number(match[2]);
    switch (match[1].toLowerCase()) {
      case "chrome": floors.chrome = version; break;
      case "edge": floors.edge = version; break;
      case "firefox": floors.firefox = version; break;
      case "safari": floors.safari = version; break;
      case "ios_saf":
      case "ios": floors.iosSafari = version; break;
    }
  }
  return floors;
}

function meetsFloors(actual: BrowserVersionFloor, expected: Required<BrowserVersionFloor>): boolean {
  return (actual.chrome ?? 0) >= expected.chrome
    && (actual.edge ?? 0) >= expected.edge
    && (actual.firefox ?? 0) >= expected.firefox
    && (actual.safari ?? 0) >= expected.safari
    && (actual.iosSafari ?? 0) >= expected.iosSafari;
}

function stableId(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `browser-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
