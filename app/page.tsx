"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Download, LoaderCircle, RefreshCw } from "lucide-react";

type DiseaseValue = { latest: number; previous: number; change: number };
type PosterData = {
  year: number;
  week: number;
  previousWeek: number;
  period: string;
  influenza: DiseaseValue;
  covid: DiseaseValue;
  sourceUrl: string;
  pdfUrl: string;
  fetchedAt: string;
};

const initialData: PosterData = {
  year: 2026,
  week: 39,
  previousWeek: 38,
  period: "09/21〜09/27",
  influenza: { latest: 13.83, previous: 7.5, change: 6.33 },
  covid: { latest: 1.5, previous: 1.5, change: 0 },
  sourceUrl: "https://www.pref.fukushima.lg.jp/sec/21910a/kansenshojoho.html",
  pdfUrl: "https://www.pref.fukushima.lg.jp/uploaded/attachment/765337.pdf",
  fetchedAt: "2026-09-30T00:00:00.000Z",
};

function formatValue(value: number) {
  return value.toFixed(2);
}

function changePresentation(change: number) {
  if (change > 0.004) return { text: `増減 +${change.toFixed(2)}`, arrow: "↑", color: "#e86924", bg: "#fff1e8" };
  if (change < -0.004) return { text: `増減 ${change.toFixed(2)}`, arrow: "↓", color: "#08723f", bg: "#e8f6ee" };
  return { text: "±0.00", arrow: "→", color: "#52605a", bg: "#eef2f0" };
}

function DiseaseCard({ x, color, title, english, data }: { x: number; color: string; title: string; english: string; data: DiseaseValue }) {
  const change = changePresentation(data.change);
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="424" width="342" height="292" rx="28" fill="#ffffff" stroke={color} strokeWidth="3" />
      <rect x="0" y="424" width="342" height="61" rx="26" fill={color} />
      <path d="M0 458h342v27H0z" fill={color} />
      <text x="171" y="463" textAnchor="middle" fill="#fff" fontSize="27" fontWeight="800">{title}</text>
      <text x="171" y="510" textAnchor="middle" fill="#607068" fontSize="14" fontWeight="700" letterSpacing="1.4">{english}</text>
      <text x="171" y="607" textAnchor="middle" fill="#173f2d" fontSize="86" fontWeight="900" letterSpacing="-4">{formatValue(data.latest)}</text>
      <text x="171" y="639" textAnchor="middle" fill="#607068" fontSize="17" fontWeight="700">定点当たり報告数</text>
      <line x1="34" y1="658" x2="308" y2="658" stroke="#dfe8e3" strokeWidth="2" />
      <text x="42" y="689" fill="#52605a" fontSize="18" fontWeight="700">前週値</text>
      <text x="155" y="689" textAnchor="end" fill="#173f2d" fontSize="22" fontWeight="900">{formatValue(data.previous)}</text>
      <rect x="175" y="669" width="144" height="35" rx="17.5" fill={change.bg} />
      <text x="247" y="692" textAnchor="middle" fill={change.color} fontSize="16" fontWeight="900">
        {change.text} <tspan fontSize="23">{change.arrow}</tspan>{data.change === 0 ? " 横ばい" : ""}
      </text>
    </g>
  );
}

function Poster({ data, svgRef }: { data: PosterData; svgRef: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} className="poster-svg" viewBox="0 0 794 1123" role="img" aria-labelledby="poster-title poster-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="poster-title">会津地域のインフルエンザ・新型コロナ流行状況</title>
      <desc id="poster-desc">福島県感染症週報の最新値、前週値、増減と感染対策をまとめた待合室向けポスター</desc>
      <defs>
        <linearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#075f39" /><stop offset="1" stopColor="#0b7c48" /></linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="11" floodColor="#063d26" floodOpacity="0.12" /></filter>
      </defs>
      <rect width="794" height="1123" fill="#f7fbf8" />
      <rect width="794" height="340" fill="url(#headerGradient)" />
      <path d="M0 305C120 333 210 307 322 321c152 19 235 49 472 2v66H0Z" fill="#92c844" opacity="0.96" />
      <path d="M0 327c156 31 239-4 363 15 145 23 257 47 431 8v48H0Z" fill="#f7fbf8" />
      <rect x="282" y="38" width="230" height="44" rx="22" fill="#f28a31" />
      <text x="397" y="68" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900" letterSpacing="2">会津地域で</text>
      <text x="397" y="137" textAnchor="middle" fill="#fff" fontSize="48" fontWeight="900" letterSpacing="-1">インフルエンザ・新型コロナ</text>
      <text x="397" y="196" textAnchor="middle" fill="#fff" fontSize="54" fontWeight="900" letterSpacing="4">流行中です</text>
      <rect x="63" y="229" width="668" height="68" rx="18" fill="#fff" opacity="0.15" stroke="#fff" strokeOpacity="0.38" />
      <text x="397" y="257" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="800">発熱・せき・のどの痛み・だるさがある方は</text>
      <text x="397" y="283" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900">受付・スタッフへお声がけください</text>
      <g filter="url(#shadow)"><rect x="42" y="350" width="710" height="82" rx="24" fill="#fff" /></g>
      <rect x="62" y="372" width="126" height="38" rx="19" fill="#dff2e8" />
      <circle cx="82" cy="391" r="6" fill="#0b7746" />
      <text x="100" y="398" fill="#075f39" fontSize="18" fontWeight="900">現在の状況</text>
      <text x="215" y="399" fill="#173f2d" fontSize="30" fontWeight="900">会津地域の最新値</text>
      <text x="717" y="397" textAnchor="end" fill="#607068" fontSize="16" fontWeight="700">1医療機関あたり</text>
      <DiseaseCard x={42} color="#ec812a" title="インフルエンザ" english="INFLUENZA" data={data.influenza} />
      <DiseaseCard x={410} color="#087545" title="新型コロナ" english="COVID-19" data={data.covid} />
      <text x="397" y="771" textAnchor="middle" fill="#173f2d" fontSize="27" fontWeight="900">感染対策のポイント</text>
      <line x1="290" y1="786" x2="504" y2="786" stroke="#95c94b" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(48 815)">
        {[
          { x: 0, label1: "こまめな", label2: "手洗い", icon: "drop" }, { x: 142, label1: "せき・発熱時は", label2: "マスク", icon: "mask" },
          { x: 284, label1: "こまめな", label2: "換気", icon: "wind" }, { x: 426, label1: "無理せず", label2: "休養", icon: "rest" },
          { x: 568, label1: "ワクチン接種も", label2: "検討", icon: "syringe" },
        ].map((item) => (
          <g key={item.icon} transform={`translate(${item.x} 0)`}>
            <circle cx="66" cy="53" r="45" fill="#e5f3eb" />
            <g transform="translate(39 26)" fill="none" stroke="#087545" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {item.icon === "drop" && <><path d="M27 2C20 12 10 22 10 34a17 17 0 0 0 34 0C44 22 34 12 27 2Z"/><path d="M18 36c2 5 5 7 10 8"/></>}
              {item.icon === "mask" && <><path d="M8 19c10 6 28 6 38 0v22c-11 8-27 8-38 0Z"/><path d="M8 24H3v12h5M46 24h5v12h-5M17 29h20M17 36h20"/></>}
              {item.icon === "wind" && <><path d="M4 18h29c12 0 12-14 2-14-5 0-7 3-7 6M4 29h40c11 0 11 15 1 15-5 0-7-3-7-6M4 40h22"/></>}
              {item.icon === "rest" && <><path d="M43 38A22 22 0 0 1 16 8a23 23 0 1 0 27 30Z"/><path d="M38 9h10l-10 11h10M7 8h7L7 16h7"/></>}
              {item.icon === "syringe" && <><path d="m13 42 27-27M32 10l12 12M37 5l12 12M11 34l9 9M9 43l-5 5M20 25l9 9"/></>}
            </g>
            <text x="66" y="120" textAnchor="middle" fill="#4c5d54" fontSize="15" fontWeight="700">{item.label1}</text>
            <text x="66" y="143" textAnchor="middle" fill="#173f2d" fontSize="20" fontWeight="900">{item.label2}</text>
          </g>
        ))}
      </g>
      <rect x="42" y="1000" width="710" height="2" fill="#d8e7de" />
      <text x="58" y="1037" fill="#173f2d" fontSize="18" fontWeight="900">最新データ {data.year}年第{data.week}週（{data.period}）</text>
      <text x="58" y="1066" fill="#65736c" fontSize="14" fontWeight="700">福島県感染症週報より</text>
      <text x="58" y="1091" fill="#87918c" fontSize="12">※定点当たり報告数。感染状況は地域全体の傾向を示すものです。</text>
      <image data-logo="aiki" href="/aiki-logo.png" x="653" y="1013" width="88" height="88" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

async function imageToDataUrl(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
}

export default function Home() {
  const [data, setData] = useState<PosterData>(initialData);
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [message, setMessage] = useState("最新公開データのプレビューです");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  async function exportPoster(nextData: PosterData) {
    const svg = svgRef.current;
    if (!svg) return;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "1588"); clone.setAttribute("height", "2246"); clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const logo = clone.querySelector('[data-logo="aiki"]');
    if (logo) logo.setAttribute("href", await imageToDataUrl("/aiki-logo.png"));
    const source = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image(); image.decoding = "sync";
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("ポスター画像の描画に失敗しました。")); image.src = objectUrl; });
    const canvas = document.createElement("canvas"); canvas.width = 1588; canvas.height = 2246;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("ブラウザで画像保存機能を利用できません。対応ブラウザでお試しください。");
    context.fillStyle = "#f7fbf8"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(objectUrl);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNGの作成に失敗しました。")), "image/png"));
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(URL.createObjectURL(png));
    setMessage(`${nextData.year}年第${nextData.week}週のポスターを作成しました`);
  }

  async function generate() {
    setStatus("loading"); setMessage("福島県の最新週報を確認しています…"); setDownloadUrl(null);
    try {
      const response = await fetch("/api/latest", { cache: "no-store" });
      const result = await response.json() as PosterData & { error?: string; detail?: string };
      if (!response.ok) throw new Error(result.detail ? `${result.error}（${result.detail}）` : result.error || "最新情報を取得できませんでした。");
      setData(result);
      await new Promise<void>((resolve) => { setTimeout(async () => { await exportPoster(result); resolve(); }, 0); });
      setStatus("success");
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "予期しないエラーが発生しました。");
    }
  }

  return (
    <main className="app-shell">
      <section className="control-panel" aria-labelledby="app-title">
        <div className="brand-lockup"><img src="/aiki-logo.png" alt="会喜地域薬局グループ" /><div><p className="eyebrow">WAITING ROOM POSTER</p><h1 id="app-title">感染症ポスター作成</h1></div></div>
        <p className="intro">福島県の最新週報から、会津地域のインフルエンザと新型コロナの数値を自動で読み取ります。</p>
        <Button onClick={generate} disabled={status === "loading"} className="generate-button">
          {status === "loading" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}{status === "loading" ? "最新情報を取得中…" : "最新情報からポスターを作成"}
        </Button>
        <div className={`status-card status-${status}`} role="status" aria-live="polite">
          {status === "error" ? <AlertCircle aria-hidden="true" /> : status === "success" ? <CheckCircle2 aria-hidden="true" /> : <span className="status-dot" />}<span>{message}</span>
        </div>
        {downloadUrl && <a className="download-link" href={downloadUrl} download={`会津感染症ポスター_${data.year}年第${data.week}週.png`}><Download aria-hidden="true" /> PNGで保存</a>}
        <dl className="source-details"><div><dt>対象</dt><dd>会津保健所管内</dd></div><div><dt>公開週</dt><dd>{data.year}年第{data.week}週</dd></div><div><dt>出典</dt><dd><a href={data.pdfUrl} target="_blank" rel="noreferrer">福島県感染症週報</a></dd></div></dl>
      </section>
      <section className="preview-panel" aria-label="A4ポスタープレビュー">
        <div className="preview-heading"><div><span>A4・縦</span><h2>ポスタープレビュー</h2></div><p>生成後、そのままPNGで保存できます</p></div>
        <div className="poster-frame"><Poster data={data} svgRef={svgRef} /></div>
      </section>
    </main>
  );
}
