FROM node:20-alpine

RUN apk add --no-cache libc6-compat git

# create-next-app をあらかじめグローバルインストール（npxの確認プロンプト回避）
RUN npm install -g create-next-app

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
