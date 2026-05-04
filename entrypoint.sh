#!/bin/sh
set -e

echo "========================================="
echo "  Next.js Docker 開発環境"
echo "========================================="

if [ ! -f "package.json" ]; then
  echo ""
  echo ">>> Next.js プロジェクトが見つかりません。初期化を開始します..."
  echo ""

  rm -rf /tmp/nextjs-init
  create-next-app /tmp/nextjs-init \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --no-git \
    --yes

  cp -a /tmp/nextjs-init/. .
  rm -rf /tmp/nextjs-init

  echo ""
  echo ">>> Next.js プロジェクトの初期化が完了しました！"
else
  echo ""
  echo ">>> 既存の Next.js プロジェクトを検出しました。"
  # node_modules ではなく next の実行ファイルで判定（Volume が空の場合も対応）
  if [ ! -f "node_modules/.bin/next" ]; then
    echo ">>> 依存関係をインストール中..."
    npm install
  fi
fi

echo ""
echo ">>> 開発サーバーを起動します: http://localhost:3000"
echo ""

exec npm run dev
