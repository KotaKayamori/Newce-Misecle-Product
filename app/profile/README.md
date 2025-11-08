# プロフィールページ (Profile Page)

## 📁 ディレクトリ構造

```
app/profile/
├── page.tsx                    # メインページコンポーネント (目標: 200行以下)
├── AuthedMyPage.tsx           # 既存のコンポーネント
├── README.md                   # このファイル
├── components/                 # ページ固有のUIコンポーネント
│   ├── ProfileHeader.tsx       # プロフィールヘッダー
│   ├── ProfileStats.tsx        # 統計情報表示
│   ├── SettingsList.tsx        # 設定一覧
│   ├── VideoUploadButton.tsx   # 動画アップロードボタン
│   └── modals/                 # モーダルコンポーネント群
│       ├── EditProfileModal.tsx              # プロフィール編集
│       ├── AccountSettingsModal.tsx          # アカウント設定
│       ├── NotificationSettingsModal.tsx     # 通知設定
│       ├── LocationSettingsModal.tsx         # 位置情報設定
│       ├── EmailSettingsModal.tsx            # メール設定
│       ├── FAQModal.tsx                      # FAQ
│       ├── ContactFormModal.tsx              # お問い合わせフォーム
│       ├── BugReportModal.tsx                # バグ報告
│       ├── GenderAgeModal.tsx                # 性別・年齢選択
│       └── ManagementModal.tsx               # 管理画面
└── hooks/                      # ページ固有のカスタムフック
    ├── useProfileSettings.ts   # 設定管理ロジック
    └── useProfileModals.ts     # モーダル状態管理
```

## 🎯 リファクタリングの目標

- **メインページ**: 3,094行 → **200行以下**
- **モーダルの分離**: 20個以上のモーダルを個別コンポーネントに
- **状態管理の改善**: モーダル状態を一元管理
- **コードの重複削除**: 共通パターンの統合

## 📝 実装順序

### Phase 1: モーダル状態管理の改善
1. ⬜ `hooks/useProfileModals.ts` - モーダル状態を一元管理

### Phase 2: モーダルコンポーネントの抽出
2. ⬜ `components/modals/EditProfileModal.tsx`
3. ⬜ `components/modals/AccountSettingsModal.tsx`
4. ⬜ `components/modals/NotificationSettingsModal.tsx`
5. ⬜ その他のモーダル...

### Phase 3: UIコンポーネントの抽出
6. ⬜ `components/ProfileHeader.tsx`
7. ⬜ `components/ProfileStats.tsx`
8. ⬜ `components/SettingsList.tsx`

### Phase 4: メインページの簡素化
9. ⬜ `page.tsx` のリファクタリング

## 🔗 依存関係

### 既存コンポーネント
- `@/components/uploader/VideoUploader`
- `@/components/my-videos/MyVideosPanel`
- `@/components/auth-provider`
- `@/components/navigation`

### 既存フック
- `@/hooks/useUserProfile`
- `@/hooks/use-toast`

### Actions
- `@/app/actions/email-actions`
- `@/app/actions/profile-actions`


