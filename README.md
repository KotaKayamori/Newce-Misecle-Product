# Newce-Misecle-Product
ショート動画型のグルメ予約サービスのアプリケーション開発

## セットアップ

1) 依存関係インストール

```
pnpm install
# or
npm install
```

2) 環境変数

プロジェクト直下に `.env.local` を作成して以下を設定してください。雛形は `.env.example` を参照。

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 開発時のデモログインを有効化（本番では未設定を推奨）
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

補足: 環境変数が未設定でもアプリはクラッシュしないようにフォールバックしますが、Supabase を利用する機能（認証/保存系）は動作しません。

3) 開発サーバー起動

```
pnpm dev
# or
npm run dev
```

## ログインについて

- 未ログイン時 `/profile` にアクセスすると、マイページにログイン画面が表示されます。
- `/auth/login` でも同じログイン画面が表示され、フッター（下部ナビ）が常に表示されます。

### デモログイン（開発用）

以下の資格情報でログインできます（`NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` が有効なとき）。

- メール: `demo@misecle.local`
- パスワード: `misecle123`

本番運用では Supabase の認証を利用し、デモログインは無効化してください。

## 動画アップロード（概要）

- 基本方針: 公開バケットで再生 + 認証ユーザーのみ書き込み。
- 実装方針: サーバーで `createSignedUploadUrl()` によりトークンを発行し、クライアントは `uploadToSignedUrl()` でアップロードします。
- キャッシュ: `cacheControl: '31536000'`（1年）を付与し、上書きではなく“新しいパス”で差し替える運用を推奨します。

詳細実装は P1 以降で追加予定です。

### 運用ルール（キャッシュ/バージョニング）

- すべてのアップロードは `cacheControl: '31536000'`（1年）で配信されます（CDN/ブラウザで長期キャッシュ）。
- 上書きは禁止（`upsert: false`）。更新は「新しいパス（UUID）」でアップロードし、URLを差し替えてください。
- パス規約は `videos/{user_id}/{yyyy}/{mm}/{uuid}.{ext}` です。
- 公開バケットでは `getPublicUrl()` を使って `<video src>` に直接指定できます。バケットを非公開にした場合は `createSignedUrl(path, expiresIn)` へ切り替えてください。

### 初期化（Storage/RLS と メタテーブル）

1) Storage/RLS（公開バケット + 本人のみ書込）

- Supabase の SQL Editor で `scripts/supabase-storage.sql` を実行
  - `videos` バケット（public=true）を作成
  - `storage.objects` に RLS を適用（`bucket_id='videos' AND storage.foldername(name)[1] = auth.uid()`）

2) メタテーブル `user_videos`

- Supabase の SQL Editor で `scripts/user-videos.sql` を実行
  - `user_videos` 作成（`user_id` 所有者RLS）
  - `INSERT/SELECT/UPDATE/DELETE` は `user_id = auth.uid()` のみ許可

### よくある注意点

- Service Role キーはサーバー専用（`app/api/videos/create-signed-upload/route.ts` でのみ使用）。クライアントに露出しないようにしてください。
- QUIC/HTTP3 由来の動画読み込みエラーはブラウザ/ネットワーク依存です。再試行・別ブラウザ確認・ハードリロードで多くは解消します。
- RSC payload エラーでナビが一時的に失敗した場合でも、ブラウザナビにフォールバックします。dev 再起動・ハードリロードで安定することがあります。

### P1: Storage バケット/RLS 設定

1) Supabase の SQL Editor で以下を実行（または `scripts/supabase-storage.sql` を貼り付け）

- 目的: 公開バケット `videos` 作成（public=true）/ RLS で「自分のフォルダのみ書込み/更新/削除」を許可
- ファイル: `scripts/supabase-storage.sql`

2) ポリシー方針（抜粋）

- INSERT/UPDATE/DELETE: `bucket_id='videos' AND (storage.foldername(name))[1] = auth.uid()::text`
- SELECT: 公開再生のみなら不要（一覧取得が必要になった段階で自分のオブジェクトだけ許可する SELECT を追加）

3) パス命名規約（推奨）

- `videos/{user_id}/{yyyy}/{mm}/{uuid}.{ext}`
- キャッシュ: `cacheControl: '31536000'` を付与、上書き禁止（新パス原則）
