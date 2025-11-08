# 検索ページ (Search Page)

## 📁 ディレクトリ構造

```
app/search/
├── page.tsx                    # メインページコンポーネント (目標: 150行以下)
├── types.ts                    # 型定義
├── README.md                   # このファイル
├── components/                 # ページ固有のUIコンポーネント
│   ├── SearchHeader.tsx        # 検索ヘッダー
│   ├── CategoryTabs.tsx        # カテゴリタブ
│   ├── SearchHistory.tsx       # 検索履歴
│   ├── PopularKeywords.tsx     # 人気キーワード
│   ├── VideoGrid.tsx           # 動画グリッド表示
│   ├── AlbumGrid.tsx           # アルバムグリッド表示
│   └── modals/                 # モーダルコンポーネント群
│       ├── FilterModal.tsx           # フィルターモーダル
│       ├── UserProfileModal.tsx      # ユーザープロフィールモーダル
│       ├── StoreDetailModal.tsx      # 店舗詳細モーダル
│       └── ReservationModal.tsx      # 予約モーダル (共通コンポーネントを再利用)
└── hooks/                      # ページ固有のカスタムフック
    ├── useSearchVideos.ts      # 検索ロジック
    ├── useAlbums.ts            # アルバム取得・操作ロジック
    ├── useFilters.ts           # フィルター管理ロジック
    └── useVideoPlayer.ts       # 動画プレイヤー制御ロジック
```

## 🎯 リファクタリングの目標

- **メインページ**: 1,672行 → **150行以下**
- **責務の分離**: UI、ビジネスロジック、状態管理を明確に分離
- **再利用性の向上**: コンポーネントとフックを適切に分割
- **保守性の向上**: 各ファイルが単一責任の原則に従う

## 📝 実装順序

### Phase 1: 型定義とフックの抽出
1. ✅ `types.ts` - 型定義
2. ⬜ `hooks/useSearchVideos.ts` - 検索ロジック
3. ⬜ `hooks/useFilters.ts` - フィルター管理
4. ⬜ `hooks/useAlbums.ts` - アルバム管理

### Phase 2: モーダルコンポーネントの抽出
5. ⬜ `components/modals/FilterModal.tsx`
6. ⬜ `components/modals/UserProfileModal.tsx`
7. ⬜ `components/modals/StoreDetailModal.tsx`

### Phase 3: その他のUIコンポーネントの抽出
8. ⬜ `components/SearchHeader.tsx`
9. ⬜ `components/CategoryTabs.tsx`
10. ⬜ `components/SearchHistory.tsx`
11. ⬜ `components/VideoGrid.tsx`
12. ⬜ `components/AlbumGrid.tsx`

### Phase 4: メインページの簡素化
13. ⬜ `page.tsx` のリファクタリング

## 🔗 依存関係

### 共通コンポーネント (既存)
- `@/components/VideoCard`
- `@/components/AlbumCard`
- `@/components/VideoFullscreenOverlay`
- `@/components/AlbumViewerOverlay`
- `@/components/navigation`

### 共通フック (既存)
- `@/hooks/useBookmark`
- `@/hooks/useLike`
- `@/hooks/useRandomVideos`

### ライブラリ
- `@/lib/supabase`
- `@/lib/video-actions`
- `@/lib/likes`


