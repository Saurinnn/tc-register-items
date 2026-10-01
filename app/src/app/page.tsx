"use client";

import React, { useState } from "react";
import { parseSource, type ParsedRow } from "@/lib/parse";

export default function ExtractionPage() {
  const [sourceText, setSourceText] = useState("");
  const [items, setItems] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleExtract = () => {
    if (!sourceText.trim()) return;

    setIsProcessing(true);

    try {
      const parsed = parseSource(sourceText);
      setItems(parsed);

      if (parsed.length === 0) {
        alert("有効なデータが見つかりませんでした。HTMLの構造をご確認ください。");
      }
    } catch (error) {
      console.error("抽出エラー:", error);
      alert("抽出処理中にエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSourceText("");
    setItems([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  };

  const getItemRows = (item: ParsedRow) => [
    { label: "ASIN抽出", value: item.asin, isLink: false },
    { label: "Amazonから商品名抽出", value: item.amazonName, isLink: false },
    {
      label: "楽天の情報を抽出（その1）",
      value: item.rakuten[0]?.url ?? "",
      isLink: true,
    },
    {
      label: "楽天の情報を抽出（その2）",
      value: item.rakuten[1]?.url ?? "",
      isLink: true,
    },
    {
      label: "楽天の情報を抽出（その3）",
      value: item.rakuten[2]?.url ?? "",
      isLink: true,
    },
    { label: "Amazon販売価格", value: item.amazonPrice, isLink: false },
    { label: "Amazon手数料", value: item.amazonFee, isLink: false },
    {
      label: "利益",
      value: item.profit,
      isLink: false,
      isBold: true,
    },
  ];

  // 楽天URL3件をまとめてコピー
  const copyItemTsv = async (item: ParsedRow, index: number) => {
    const tsv = [
      item.rakuten[0]?.url ?? "",
      item.rakuten[1]?.url ?? "",
      item.rakuten[2]?.url ?? "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedIndex(`rakuten-${index}`);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error("コピーエラー:", error);
      alert("コピーに失敗しました。");
    }
  };

  // 各回答を個別にコピー
  const copyValue = async (value: string, key: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(key);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error("コピーエラー:", error);
      alert("コピーに失敗しました。");
    }
  };

  // 全結果をTSVでコピー
  const copyAllTsv = async () => {
    if (items.length === 0) return;

    const allTsvBlocks = items.map((item, n) => {
      const rows = getItemRows(item);
      const lines = rows.map((r) => [r.label, r.value].join("\t"));

      if (items.length > 1) {
        return [
          `# 結果 ${n + 1}`,
          ["質問列（親）", "回答列"].join("\t"),
          ...lines,
        ].join("\n");
      }

      return [
        ["質問列（親）", "回答列"].join("\t"),
        ...lines,
      ].join("\n");
    });

    try {
      await navigator.clipboard.writeText(allTsvBlocks.join("\n\n"));
      setCopiedAll(true);

      setTimeout(() => {
        setCopiedAll(false);
      }, 2000);
    } catch (error) {
      console.error("コピーエラー:", error);
      alert("コピーに失敗しました。");
    }
  };

  const th =
    "py-3.5 px-4 font-semibold text-gray-900 bg-gray-50/80 align-top text-sm border-r border-gray-200";

  const val =
    "py-3.5 px-4 text-gray-900 text-sm";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            リサーチ抽出ツール
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            貼り付けたHTMLソースから必要な情報（ASIN、商品名、楽天URLその1〜3、価格、手数料、利益）を抽出します。
          </p>
        </div>
      </div>

      {/* HTML入力エリア */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <label
          htmlFor="source-input"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          HTMLソース入力(&lt;tr&gt;…&lt;/tr&gt;)
        </label>

        <textarea
          id="source-input"
          className="h-48 w-full rounded-lg border border-gray-300 p-4 font-mono text-xs shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="ここにHTMLソース (<tr>…</tr>) を貼り付けてください..."
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

          <span className="text-xs text-gray-500">
            ※ poipoiの画面で開発者ツールを開きアイテムの(&lt;tr&gt;…&lt;/tr&gt;)をcopy elementで貼り付け
          </span>

          <div className="flex gap-3">

            {/* リセット */}
            <button
              type="button"
              onClick={handleReset}
              disabled={
                isProcessing ||
                (!sourceText && items.length === 0)
              }
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              リセット
            </button>

            {/* 抽出 */}
            <button
              type="button"
              onClick={handleExtract}
              disabled={
                isProcessing ||
                !sourceText.trim()
              }
              className="cursor-pointer rounded-lg bg-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isProcessing
                ? "抽出処理中..."
                : "抽出を実行する"}
            </button>

          </div>
        </div>
      </div>

      {/* 全結果コピー */}
      {items.length > 1 && (
        <div className="mb-6 flex justify-end">

          <button
            type="button"
            onClick={copyAllTsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            {copiedAll ? (
              <>
                <span className="font-bold text-green-600">
                  ✓
                </span>

                <span className="text-green-600">
                  全結果をコピー完了
                </span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>
                  すべての結果をコピー (TSV)
                </span>
              </>
            )}
          </button>

        </div>
      )}

      {/* 抽出結果 */}
      {items.map((item, n) => {

        const rows = getItemRows(item);

        return (
          <div
            key={n}
            className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >

            {/* 結果ヘッダー */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3">

              <span className="text-sm font-semibold text-gray-800">
                抽出結果{" "}
                {items.length > 1
                  ? `(#${n + 1})`
                  : ""}
              </span>

              {/* 楽天URL3件コピー */}
              <button
                type="button"
                onClick={() =>
                  copyItemTsv(item, n)
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >

                {copiedIndex === `rakuten-${n}` ? (
                  <>
                    <span className="font-bold text-green-600">
                      ✓
                    </span>

                    <span className="text-green-600">
                      コピー完了
                    </span>
                  </>
                ) : (
                  <>
                    <span>📋</span>

                    <span>
                      楽天リンク3件をコピー
                    </span>
                  </>
                )}

              </button>

            </div>

            {/* 結果テーブル */}
            <table className="min-w-full divide-y divide-gray-200 text-sm">

              <thead className="border-b border-gray-200 bg-gray-100/90">

                <tr>

                  <th className="w-2/5 border-r border-gray-200 px-4 py-3.5 text-left font-semibold text-gray-700">
                    質問列
                  </th>

                  <th className="w-3/5 px-4 py-3.5 text-left font-semibold text-gray-700">
                    回答列
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {rows.map((r, idx) => {

                  const copyKey = `${n}-${idx}`;

                  return (
                    <tr
                      key={idx}
                      className="transition-colors hover:bg-gray-50/50"
                    >

                      {/* 質問列 + 個別コピー */}
                      <td className={th}>

                        <div className="flex items-center justify-between gap-2">

                          <span>
                            {r.label}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              copyValue(
                                r.value,
                                copyKey
                              )
                            }
                            disabled={!r.value}
                            title="回答をコピー"
                            className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {copiedIndex === copyKey ? (
                              <span className="font-bold text-green-600">
                                ✓
                              </span>
                            ) : (
                              "📋"
                            )}

                          </button>

                        </div>

                      </td>

                      {/* 回答列 */}
                      <td
                        className={`${val} ${r.isBold
                          ? "font-bold text-emerald-700"
                          : ""
                          }`}
                      >

                        {r.isLink && r.value ? (

                          <a
                            href={r.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {r.value}
                          </a>

                        ) : (
                          r.value || (
                            <span className="text-gray-400">
                              -
                            </span>
                          )
                        )}

                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

          </div>
        );
      })}

    </div>
  );
}

