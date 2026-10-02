import { ExtractionError, fetchLatestReport } from "@/lib/fukushima";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await fetchLatestReport();
    return Response.json(report, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const known = error instanceof ExtractionError;
    const stageLabels = { index: "県の感染症情報ページの確認", "pdf-download": "最新週報PDFの取得", "pdf-layout": "PDF内の会津データの解析", validation: "抽出結果の検証" } as const;
    const stage = known ? stageLabels[error.stage] : "最新情報の取得";
    const detail = error instanceof Error ? error.message : "不明なエラー";
    console.error("[latest-report]", { stage, detail });
    return Response.json({ error: stage + "に失敗しました。", detail }, { status: known ? 502 : 500, headers: { "Cache-Control": "no-store" } });
  }
}
