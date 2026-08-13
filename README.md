# MERDEX Swap

从 MER-Perps-Global 中独立出来的 Swap 单页项目。它只保留 WooFi Swap、Orderly 钱包连接和链切换能力，不依赖原项目的路由或其他业务页面。

## 启动

```bash
cd swap-app
yarn install
yarn dev
```

生产构建：

```bash
yarn build
```

## 配置

复制 `.env.example` 为 `.env.local`，或直接修改 `public/config.js`。运行时配置优先级高于构建时环境变量。

- `VITE_BROKER_EOA_ADDRESS`：WooFi broker 地址。
- `VITE_ORDERLY_BROKER_ID`：Orderly broker ID，用于官方应用外框和账户状态。
- `VITE_ORDERLY_BROKER_NAME`：Orderly 外框中显示的 broker 名称。
- `VITE_PERPS_REDIRECT_URL`：点击 Perps 标签时跳转的地址。
- `PUBLIC_PATH`：可选的部署子路径，例如 `/swap/`。
