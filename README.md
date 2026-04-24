# パラメトリック曲線デモ（ベジェ / Catmull-Rom）

JavaScript と three.js により、ベジェ曲線（De Casteljau）と Catmull-Rom スプラインを自前アルゴリズムで評価し、同一制御点での形状を比較するデモです。

## 前提

- [Nix](https://nixos.org/)（`nix develop` が使えること）
- ブラウザ

## セットアップ

```bash
nix develop
npm install
```

## 開発サーバーで確認

```bash
npm run dev
```

ブラウザで **http://localhost:5173/** を開きます（ポート未変更時）。

## その他のコマンド

| コマンド | 説明 |
|----------|------|
| `npm run build` | 本番用ビルド（`dist/`） |
| `npm run preview` | ビルド結果のプレビュー（既定では http://localhost:4173/ ） |

## リポジトリに含めるもの

- `flake.nix` / `flake.lock` … Nix で Node のバージョンを固定
- `package.json` … npm 依存の宣言（`package-lock.json` は `npm install` で生成される場合はコミット推奨）

`node_modules/` と `dist/` は `.gitignore` で除外します。
