"use client"

interface PhoneDialCardProps {
  open: boolean
  stores?: { name: string; tel: string | null; tabelog?: string | null }[]
  onClose: () => void
}

const sanitizeTel = (input?: string | null) => (typeof input === "string" ? input.replace(/[^\d+]/g, "") : "")

export function PhoneDialCard({ open, stores, onClose }: PhoneDialCardProps) {
  if (!open) return null

  const storeEntries = (stores ?? []).map((store, index) => {
    const name = store.name?.trim() || `店舗${index + 1}`
    const sanitizedTel = sanitizeTel(store.tel ?? undefined)
    return {
      key: `${name}-${index}`,
      name,
      displayTel: store.tel ?? "",
      sanitizedTel,
      tabelog: store.tabelog,
    }
  })

  const handleCall = (tel: string) => {
    if (!tel) return
    window.location.href = `tel:${tel}`
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[90%] max-w-md rounded-3xl bg-[#2F2E30] bg-opacity-90 p-4 text-center shadow-2xl space-y-4">
        {storeEntries.length === 0 ? (
          <div className="space-y-3">
            <p className="text-white text-sm">電話番号が見つかりませんでした</p>
            <button
              type="button"
              className="w-full rounded-[22px] bg-[#504f52] py-3 text-base font-semibold text-white/90 hover:bg-[#5c5b5f]"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {storeEntries.map((store, idx) => (
              <div key={store.key} className="rounded-2xl bg-white/95 px-4 py-3 text-left space-y-2">
                <p className="text-sm font-semibold text-gray-800">{store.name}</p>
                {store.sanitizedTel ? (
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-orange-600 py-2 text-base font-semibold text-white shadow transition hover:bg-orange-700"
                    onClick={() => handleCall(store.sanitizedTel)}
                  >
                    {store.displayTel} に発信
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-gray-200 py-2 text-base font-semibold text-gray-500"
                  >
                    電話番号が見つかりません
                  </button>
                )}
                {store.tabelog && (
                  <a
                    href={store.tabelog}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center w-full rounded-2xl bg-[#f5b400] py-2 text-sm font-semibold text-white shadow transition hover:bg-[#e0a200]"
                  >
                    食べログで見る
                  </a>
                )}
              </div>
            ))}
            <button
              type="button"
              className="w-full rounded-[22px] bg-[#504f52] py-3 text-base font-semibold text-white/90 hover:bg-[#5c5b5f]"
              onClick={onClose}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
