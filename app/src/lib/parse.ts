export type RakutenLink = { url: string; shop: string; title: string };
export type ParsedRow = {
  asin: string;
  amazonName: string;
  rakuten: RakutenLink[]; // 最大3件
  amazonPrice: string;
  amazonFee: string;
  profit: string;
};

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
// ¥・円記号・カンマを除去して数字のみにする
const money = (s: string) => s.replace(/[¥￥\\,\s]/g, "");

export function parseSource(html: string): ParsedRow[] {
  const doc = new DOMParser().parseFromString(`<table><tbody>${html}</tbody></table>`, "text/html");
  let rows: Element[] = Array.from(doc.querySelectorAll("tr"));
  if (rows.length === 0) rows = [doc.body];

  return rows.map((tr) => {
    // ASIN: <p>ASIN</p> の直後のテキスト
    const asinP = Array.from(tr.querySelectorAll("p")).find((p) => text(p) === "ASIN");
    let asin = asinP ? text(asinP.parentElement).replace("ASIN", "").trim() : "";
    if (!asin) asin = tr.querySelector('a[href*="amazon.co.jp/dp/"]')?.getAttribute("href")?.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ?? "";

    const amazonName = text(tr.querySelector(".amazon")?.nextElementSibling);

    const rakuten: RakutenLink[] = [];
    tr.querySelectorAll(".rakuten").forEach((label) => {
      let a = label.nextElementSibling;
      if (!a || a.tagName !== "A") {
        a = label.querySelector("a") ?? label.parentElement?.querySelector("a") ?? null;
      }
      if (a?.tagName === "A" && rakuten.length < 3) {
        const href = a.getAttribute("href") ?? "";
        if (href && !rakuten.some((r) => r.url === href)) {
          rakuten.push({
            url: href,
            shop: text(a),
            title: text(a.nextElementSibling),
          });
        }
      }
    });

    if (rakuten.length === 0) {
      tr.querySelectorAll('a[href*="rakuten.co.jp"]').forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        if (href && rakuten.length < 3 && !rakuten.some((r) => r.url === href)) {
          rakuten.push({
            url: href,
            shop: text(a),
            title: text(a.nextElementSibling),
          });
        }
      });
    }

    const cells = tr.querySelectorAll("td.padding-27");
    const first = (el: Element | undefined) => {
      // 子要素の金額テキストのみ (空divを除く)
      return money(Array.from(el?.childNodes ?? []).filter((n) => n.nodeType === 3).map((n) => n.textContent).join("") || text(el));
    };

    // 利益: 「(ポイント+現金)」直後の金額
    const profitEl = tr.querySelector(".item-point-profit > div > div");
    const profit = money(text(profitEl));

    return { asin, amazonName, rakuten, amazonPrice: first(cells[0]), amazonFee: first(cells[1]), profit };
  }).filter((r) => r.asin || r.amazonName || r.rakuten.length > 0 || r.amazonPrice || r.profit);
}
