"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"

interface GenderAgeScreenProps {
  onClose: () => void
  initialGender?: string
  initialAge?: string
  onSave: (gender: string, age: string) => Promise<void>
  isUpdating: boolean
  error?: string | null
}

export function GenderAgeScreen({
  onClose,
  initialGender = "",
  initialAge = "",
  onSave,
  isUpdating,
  error,
}: GenderAgeScreenProps) {
  const [selectedGender, setSelectedGender] = useState(initialGender)
  const [selectedAge, setSelectedAge] = useState(initialAge)

  useEffect(() => {
    setSelectedGender(initialGender)
    setSelectedAge(initialAge)
  }, [initialGender, initialAge])

  const handleSave = async () => {
    await onSave(selectedGender, selectedAge)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">性別と年齢</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-6">
          {/* Gender Selection */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">性別</h4>
            <div className="space-y-3">
              {["男性", "女性", "その他"].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedGender === gender ? "border-orange-500 bg-orange-500" : "border-gray-300"
                    }`}
                  >
                    {selectedGender === gender && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-gray-800">{gender}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Age Selection */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">年齢</h4>
            <div className="space-y-3">
              {["10代", "20代", "30代", "40代", "50代以上"].map((age) => (
                <button
                  key={age}
                  onClick={() => setSelectedAge(age)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAge === age ? "border-orange-500 bg-orange-500" : "border-gray-300"
                    }`}
                  >
                    {selectedAge === age && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-gray-800">{age}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isUpdating || !selectedGender || !selectedAge}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
          >
            {isUpdating ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  )
}

