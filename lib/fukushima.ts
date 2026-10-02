import { getDocumentProxy } from "unpdf";

export const SOURCE_URL = "https://www.pref.fukushima.lg.jp/sec/21910a/kansenshojoho.html";

type DiseaseResult = { latest: number; previous: number; change: number };
type ReportLink = { year: number; week: number; url: string };

export type LatestReport = {
  year: number;
  week: number;
  previousWeek: number;
  period: string;
  influenza: DiseaseResult;
  covid: DiseaseResult;
  sourceUrl: string;
  pdfUrl: string;
  fetchedAt: string;
};

export class ExtractionError extends Error {
  constructor(public stage: "index" | "pdf-download" | "pdf-layout" | "validation", message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

export function findLatestWeeklyPdf(html: string): ReportLink {
  const candidates: ReportLink[] = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html))) {
    const label = stripHtml(match[2]);
    const weekMatch = label.match(/第?\s*(\d{1,2})\s*週/);
    if (!weekMatch) continue;
    // The year's heading is outside the week table on the prefecture page, so keep
    // the full preceding section and use the nearest year heading.
    const preceding = stripHtml(html.slice(0, match.index));
    const years = [...preceding.matchAll(/(?:◆\s*)?(20\d{2})\s*年/g)];
    const year = years.at(-1)?.[1];
    if (!year) continue;
    candidates.push({ year: Number(year), week: Number(weekMatch[1]), url: new URL(match[1], SOURCE_URL).toString() });
  }
  if (!candidates.length) {
    throw new ExtractionError("index", "週報PDFへのリンクを県ページから見つけられませんでした。ページ構成が変更された可能性があります。");
  }
  candidates.sort((a, b) => b.year - a.year || b.week - a.week);
  return candidates[0];
}

function normalizeText(value: string) {
  return value.normalize("NFKC").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
}

function parseNumber(token: string) {
  return token === "-" ? 0 : Number(token);
}

function parseTable(text: string, disease: "influenza" | "covid", expectedWeek: number) {
  const headerPattern = /\(報告数\)\s*([^\n]+)/g;
  const headers = [...text.matchAll(headerPattern)];
  for (const header of headers) {
    const before = text.slice(Math.max(0, (header.index ?? 0) - 480), header.index ?? 0);
    const lastFlu = before.lastIndexOf("インフルエンザ");
    const lastCovid = Math.max(before.lastIndexOf("新型コロナウイルス感染症"), before.lastIndexOf("COVID-19"));
    const detected = lastCovid > lastFlu ? "covid" : "influenza";
    if (detected !== disease) continue;
    const weeks = [...header[1].matchAll(/(\d{1,2})\s*週/g)].map((entry) => Number(entry[1]));
    if (weeks.length < 2) continue;
    const latestWeekIndex = weeks.lastIndexOf(expectedWeek);
    const currentIndex = latestWeekIndex >= 1 ? latestWeekIndex : weeks.length - 1;
    const previousIndex = currentIndex - 1;
    const start = (header.index ?? 0) + header[0].length;
    const remaining = text.slice(start);
    const stopMatch = remaining.match(/\(\s*[＊*]\s*\)|\(報告数\)/);
    const body = remaining.slice(0, stopMatch?.index ?? 2600);
    const rows = body.split("\n").map((line) => line.trim()).filter((line) => {
      if (!/^(?:\d|-)/.test(line) || line.startsWith("(")) return false;
      return (line.match(/(?:\d+(?:\.\d+)?|-)/g) ?? []).length >= weeks.length;
    });
    const labelsAfter = remaining.slice(stopMatch?.index ?? body.length, (stopMatch?.index ?? body.length) + 900);
    const regionOrder = ["県内総数", "福島市", "県北", "郡山市", "県中", "県南", "会津", "南会津", "相双", "いわき市"];
    const aizuIndex = regionOrder.indexOf("会津");
    const labelsPresent = regionOrder.filter((label) => labelsAfter.includes(label));
    if (rows.length < regionOrder.length || !labelsPresent.includes("会津")) continue;
    const tokens = rows[aizuIndex].match(/(?:\d+(?:\.\d+)?|-)/g) ?? [];
    const previous = parseNumber(tokens[previousIndex]);
    const latest = parseNumber(tokens[currentIndex]);
    if (!Number.isFinite(previous) || !Number.isFinite(latest)) continue;
    return { previousWeek: weeks[previousIndex], latestWeek: weeks[currentIndex], previous, latest, change: Number((latest - previous).toFixed(2)) };
  }
  throw new ExtractionError("pdf-layout", disease === "influenza" ? "PDF内のインフルエンザ表から会津行を特定できませんでした。" : "PDF内の新型コロナ表から会津行を特定できませんでした。");
}

function parseMetadata(text: string, fallback: ReportLink) {
  const compact = text.replace(/\s+/g, "");
  const match = compact.match(/(20\d{2})年第(\d{1,2})週\((\d{1,2})月(\d{1,2})日[~〜～](\d{1,2})月(\d{1,2})日\)/);
  if (!match) return { year: fallback.year, week: fallback.week, period: "第" + fallback.week + "週" };
  const [, year, week, startMonth, startDay, endMonth, endDay] = match;
  const pad = (value: string) => value.padStart(2, "0");
  return { year: Number(year), week: Number(week), period: pad(startMonth) + "/" + pad(startDay) + "〜" + pad(endMonth) + "/" + pad(endDay) };
}

async function getPageText(pdf: Awaited<ReturnType<typeof getDocumentProxy>>, pageNumber: number) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  let result = "";
  for (const item of content.items) {
    if (!("str" in item)) continue;
    result += item.str;
    result += "hasEOL" in item && item.hasEOL ? "\n" : " ";
  }
  return normalizeText(result);
}

export async function parseWeeklyPdf(bytes: Uint8Array, link: ReportLink) {
  const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216, disableFontFace: true });
  if (pdf.numPages < 3 || pdf.numPages > 50) throw new ExtractionError("validation", "PDFのページ数が想定範囲外です（" + pdf.numPages + "ページ）。");
  const firstPage = await getPageText(pdf, 1);
  const metadata = parseMetadata(firstPage, link);
  let tablePage = "";
  for (let pageNumber = 2; pageNumber <= Math.min(pdf.numPages, 6); pageNumber += 1) {
    const text = await getPageText(pdf, pageNumber);
    if (text.includes("インフルエンザ") && (text.includes("新型コロナウイルス感染症") || text.includes("COVID-19")) && text.includes("(報告数)")) {
      tablePage = text;
      break;
    }
  }
  if (!tablePage) throw new ExtractionError("pdf-layout", "定点当たり報告数の表をPDF先頭6ページから見つけられませんでした。");
  const influenza = parseTable(tablePage, "influenza", metadata.week);
  const covid = parseTable(tablePage, "covid", metadata.week);
  if (influenza.latestWeek !== metadata.week || covid.latestWeek !== metadata.week || influenza.previousWeek !== covid.previousWeek) {
    throw new ExtractionError("validation", "週番号と表ヘッダの対応が一致しませんでした。誤表示を防ぐため生成を中止しました。");
  }
  return {
    metadata,
    previousWeek: influenza.previousWeek,
    influenza: { latest: influenza.latest, previous: influenza.previous, change: influenza.change },
    covid: { latest: covid.latest, previous: covid.previous, change: covid.change },
  };
}

async function fetchChecked(url: string, stage: "index" | "pdf-download") {
  const response = await fetch(url, {
    headers: { "User-Agent": "AizuInfectionPoster/1.0 (+weekly public health poster)", Accept: stage === "index" ? "text/html" : "application/pdf" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new ExtractionError(stage, "福島県サイトが HTTP " + response.status + " を返しました。");
  return response;
}

export async function fetchLatestReport(): Promise<LatestReport> {
  const indexResponse = await fetchChecked(SOURCE_URL, "index");
  const link = findLatestWeeklyPdf(await indexResponse.text());
  const pdfResponse = await fetchChecked(link.url, "pdf-download");
  const contentType = pdfResponse.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("pdf")) throw new ExtractionError("pdf-download", "最新週報の応答形式がPDFではありません（" + (contentType || "不明") + "）。");
  const buffer = await pdfResponse.arrayBuffer();
  if (buffer.byteLength > 12_000_000) throw new ExtractionError("validation", "PDFの容量が12MBを超えたため、安全のため処理を中止しました。");
  const parsed = await Promise.race([
    parseWeeklyPdf(new Uint8Array(buffer), link),
    new Promise<never>((_, reject) => setTimeout(() => reject(new ExtractionError("pdf-layout", "PDFの解析が20秒以内に完了しませんでした。")), 20_000)),
  ]);
  return {
    year: parsed.metadata.year,
    week: parsed.metadata.week,
    previousWeek: parsed.previousWeek,
    period: parsed.metadata.period,
    influenza: parsed.influenza,
    covid: parsed.covid,
    sourceUrl: SOURCE_URL,
    pdfUrl: link.url,
    fetchedAt: new Date().toISOString(),
  };
}
