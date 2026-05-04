# Next.js Docker 開発環境

Docker + WSL で Next.js 開発環境をすぐに立ち上げられるテンプレートです。

## ディレクトリ構成

```
.
├── Dockerfile          # Node.js 20 Alpine ベースのイメージ
├── docker-compose.yml  # サービス・ポート・ボリューム定義
├── entrypoint.sh       # 初回自動セットアップスクリプト
├── .dockerignore
└── app/                # Next.js プロジェクト（自動生成 or 既存）
```

## 使い方

### 🚀 初回起動（Next.js プロジェクトを自動生成）

```bash
docker compose up -d
```

`app/` ディレクトリが空の場合、`create-next-app` が自動実行されます。  
起動後に http://localhost:3000 でアクセスできます。

### 📦 既存の Next.js プロジェクトを使う場合

```bash
# app/ ディレクトリに既存プロジェクトを配置
cp -r /path/to/your/nextjs-project ./app

docker compose up -d
```

### 📋 よく使うコマンド

```bash
# ログを確認
docker compose logs -f

# コンテナに入る
docker compose exec nextjs sh

# 停止
docker compose down

# イメージを再ビルド
docker compose up -d --build
```

## 注意事項

- **ホットリロード**: WSL 環境では `WATCHPACK_POLLING=true` を有効にしています
- **node_modules**: コンテナ側の Volume で管理するためホスト側には作成されません
- **ポート**: デフォルトは `3000` です。変更する場合は `docker-compose.yml` を編集してください

## 技術スタック

- Node.js 20 (Alpine)
- Next.js (最新版、TypeScript + Tailwind CSS + App Router)
- Docker Compose v2
