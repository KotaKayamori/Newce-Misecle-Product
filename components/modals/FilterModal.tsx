"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"
import type { FilterOptions } from "@/lib/types"

interface FilterModalProps {
  open: boolean
  onClose: () => void
  selectedFilters: FilterOptions
  selectedFilterCategory: string | null
  onSelectCategory: (category: string | null) => void
  onFilterToggle: (category: string, option: string) => void
  onClearAll: () => void
  getTotalSelectedCount: () => number
  getSelectedCount: (category: string | null) => number
}

const filterOptions = {
  形態: [
    "居酒屋",
    "チェーン店",
    "個人店",
    "カフェ",
    "ファミレス",
    "高級店",
    "バー",
    "ラーメン店",
    "焼肉店",
    "寿司店",
  ],
  価格帯: ["〜1,000円", "1,000〜2,000円", "2,000〜3,000円", "3,000〜5,000円", "5,000〜8,000円", "8,000円〜"],
  時間帯: ["11:00〜13:00", "13:00〜15:00", "15:00〜17:00", "17:00〜19:00", "19:00〜21:00", "21:00〜23:00", "23:00〜"],
  距離: ["徒歩5分(0.4km)", "徒歩10分(0.8km)", "徒歩15分(1.2km)", "徒歩20分(1.6km)", "徒歩25分(2.0km)", "2km以上"],
  趣味・嗜好: [
    "甘いもの",
    "魚系",
    "肉系",
    "辛いもの",
    "あっさり",
    "こってり",
    "ヘルシー",
    "ボリューム",
    "和食",
    "洋食",
    "中華",
    "エスニック",
  ],
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="w-full border border-gray-300 rounded-full py-3 px-4 text-gray-700 hover:bg-gray-100 transition text-left">
      {label}
    </button>
  )
}

export function FilterModal({
  open,
  onClose,
  selectedFilters,
  selectedFilterCategory,
  onSelectCategory,
  onFilterToggle,
  onClearAll,
  getTotalSelectedCount,
  getSelectedCount,
}: FilterModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 animate-in fade-in duration-300">
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
        {!selectedFilterCategory ? (
          // Main Filter Categories
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <div></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-blue-600 hover:text-blue-700"
              >
                すべて解除
              </Button>
            </div>

            {/* Filter Categories */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <FilterButton label="形態" />
                <FilterButton label="価格帯" />
                <FilterButton label="時間帯" />
                <FilterButton label="距離" />
                <FilterButton label="趣味・嗜好" />
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-6 border-t bg-white pb-32">
              <div className="flex justify-center pt-4">
                <Button
                  className="bg-orange-500 text-white font-bold py-2 px-8 rounded-full shadow-md hover:bg-orange-600 transition"
                  onClick={onClose}
                >
                  絞り込み
                  {getTotalSelectedCount() > 0 && (
                    <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                      {getTotalSelectedCount()}件選択中
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Specific Filter Options
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <Button variant="ghost" size="sm" onClick={() => onSelectCategory(null)}>
                ←
              </Button>
              <h2 className="text-lg font-semibold">{selectedFilterCategory}</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter Options */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-3">
                {(filterOptions[selectedFilterCategory as keyof typeof filterOptions] ?? []).map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Checkbox
                      id={option}
                      checked={
                        selectedFilterCategory ? selectedFilters[selectedFilterCategory].includes(option) : false
                      }
                      onCheckedChange={() => onFilterToggle(selectedFilterCategory, option)}
                    />
                    <label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 border-t bg-white z-10">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => onSelectCategory(null)}
              >
                選択完了
                {selectedFilterCategory && getSelectedCount(selectedFilterCategory) > 0 && (
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                    {getSelectedCount(selectedFilterCategory)}件選択中
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


