import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Result = {
  urlMatch: boolean | null;
  nameMatch: boolean | null;
  price: string;
  shipping: string;
  delivery: string;
  error?: string;
};

const norm = (s: string) => s.normalize("NFKC").toUpperCase().replace(/[\s\-_]/g, "");
const clean = (u: string) => {
  try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, ""); } catch { return u; }
};

// 型番(英字+数字を含むトークン)があればそれで、なければ単語の半数以上の一致で判定
function isNameMatch(amazonName: string, pageText: string) {
  const page = norm(pageText);
  const tokens = (amazonName.normalize("NFKC").match(/[A-Za-z0-9][A-Za-z0-9\-]{2,}/g) ?? []).filter((t) => /\d/.test(t) && /[A-Za-z]/.test(t));
  if (tokens.length) return tokens.some((t) => page.includes(norm(t)));
  const words = amazonName.normalize("NFKC").split(/[\s　]+/).filter((w) => w.length >= 2);
  if (!words.length) return false;
  return words.filter((w) => page.includes(norm(w))).length / words.length >= 0.5;
}

function extractPrice(html: string, body: string) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: unknown): string => {
        if (!n || typeof n !== "object") return "";
        const obj = n as Record<string, unknown>;
        if (obj.price != null && /^\d+(\.\d+)?$/.test(String(obj.price))) return String(Math.round(Number(obj.price)));
        for (const v of Object.values(obj)) { const r = walk(v); if (r) return r; }
        return "";
      };
      const p = walk(JSON.parse(m[1]));
      if (p) return p;
    } catch {}
  }
  const meta = html.match(/itemprop=["']price["'][^>]*content=["'](\d+)/i)?.[1];
  if (meta) return meta;
  return body.match(/(\d{1,3}(?:,\d{3})*)\s*円/)?.[1].replace(/,/g, "") ?? "";
}

function extractTextByClass(html: string, className: string): string {
  const tagRegex = new RegExp(`<([a-zA-Z0-9]+)[^>]*class\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "i");
  const openMatch = html.match(tagRegex);
  if (!openMatch || openMatch.index == null) return "";

  const tagName = openMatch[1];
  const startIndex = openMatch.index + openMatch[0].length;
  const rest = html.slice(startIndex);

  const tokenRegex = new RegExp(`<(/?)${tagName}\\b[^>]*>`, "gi");
  let depth = 1;
  let endIndex = -1;
  let m: RegExpExecArray | null;

  while ((m = tokenRegex.exec(rest)) !== null) {
    if (m[1] === "/") {
      depth--;
      if (depth === 0) {
        endIndex = m.index;
        break;
      }
    } else if (!m[0].endsWith("/>")) {
      depth++;
    }
  }

  const content = endIndex !== -1 ? rest.slice(0, endIndex) : rest.slice(0, 500);
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const { url, amazonName } = (await req.json()) as { url: string; amazonName: string };
  const out: Result = { urlMatch: null, nameMatch: null, price: "", shipping: "", delivery: "" };
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept-Language": "ja" },
    });
    const html = await res.text();

    // 1. リンクURLと実際のページURLの一致 (クエリは無視)
    out.urlMatch = clean(res.url) === clean(url);
    if (!out.urlMatch) return NextResponse.json(out); // FALSE → 以降スキップ

    const body = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";

    // 2. Amazon商品名/型番との部分一致
    out.nameMatch = isNameMatch(amazonName, title + " " + body.slice(0, 5000));
    if (!out.nameMatch) return NextResponse.json(out); // FALSE → 以降スキップ

    out.price = extractPrice(html, body);
    const shippingMethod = extractTextByClass(html, "normal-reserve-deliveryMethod");
    out.shipping = /送料無料/.test(shippingMethod) ? "0" : shippingMethod;
    out.delivery = extractTextByClass(html, "normal-reserve-deliveryDate");
  } catch (e) {
    out.error = e instanceof Error ? e.message : "fetch error";
  }
  return NextResponse.json(out);
}
