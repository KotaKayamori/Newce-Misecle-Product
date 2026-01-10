"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"
import { sendSupportInquiryAction } from "@/app/actions/email-actions"
import { useToast } from "@/hooks/use-toast"

interface ContactFormScreenProps {
  onClose: () => void
  onSuccess: (type: "contact" | "bug", message: string) => void
}

export function ContactFormScreen({ onClose, onSuccess }: ContactFormScreenProps) {
  const { toast } = useToast()
  const [contactSending, setContactSending] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // 既存の画像と合わせて最大5枚まで
    const totalImages = selectedImages.length + files.length
    if (totalImages > 5) {
      toast({
        title: "画像数制限",
        description: "画像は最大5枚まで添付できます。",
        variant: "destructive",
      })
      return
    }

    // ファイルサイズと形式チェック
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: ファイルサイズが5MBを超えています`)
        return
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: サポートされていないファイル形式です`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      toast({
        title: "ファイルエラー",
        description: errors.join('\n'),
        variant: "destructive",
      })
    }

    if (validFiles.length === 0) return

    // 既存の画像に新しい画像を追加
    setSelectedImages(prev => [...prev, ...validFiles])
    
    // プレビュー画像を生成
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreviews(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })

    // 入力フィールドをリセット
    e.target.value = ''
  }

  // 特定の画像を削除
  const handleImageRemove = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // 全画像をクリア
  const handleClearAllImages = () => {
    setSelectedImages([])
    setImagePreviews([])
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // 画像をBase64に変換
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = error => reject(error)
    })
  }

  // 画像圧縮関数
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // アスペクト比を保持してリサイズ
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, file.type, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (contactSending) return
    
    const formEl = e.currentTarget
    setContactSending(true)
    setUploadProgress(0)
    
    try {
      const form = new FormData(formEl)
      const name = (form.get("name") as string) || ""
      const email = (form.get("email") as string) || ""
      const category = (form.get("category") as string) || ""
      const message = (form.get("message") as string) || ""
      
      // 画像データの準備
      let imageDataArray: Array<{
        filename: string
        content: string
        type: string
      }> = []

      if (selectedImages.length > 0) {
        setUploadProgress(10)
        
        try {
          for (let i = 0; i < selectedImages.length; i++) {
            const file = selectedImages[i]
            
            // 必要に応じて画像を圧縮
            const processedFile = file.size > 2 * 1024 * 1024 
              ? await compressImage(file) 
              : file
            
            const base64Content = await fileToBase64(processedFile)
            imageDataArray.push({
              filename: processedFile.name,
              content: base64Content,
              type: processedFile.type
            })
            
            // プログレス更新
            setUploadProgress(10 + (i + 1) / selectedImages.length * 40)
          }
        } catch (error) {
          console.error("Failed to process images:", error)
          toast({
            title: "画像処理エラー",
            description: "画像の処理中にエラーが発生しました。画像なしで送信するか、別の画像を選択してください。",
            variant: "destructive",
          })
          setContactSending(false)
          setUploadProgress(0)
          return
        }
      }
      
      setUploadProgress(60)
      
      const res = await sendSupportInquiryAction({ 
        name, 
        email, 
        category, 
        message,
        imageDataArray: imageDataArray.length > 0 ? imageDataArray : undefined
      })
      
      setUploadProgress(100)
      
      if (res.success) {
        formEl.reset()
        handleClearAllImages()
        onSuccess(
          "contact",
          `お問い合わせを正常に送信いたしました。${imageDataArray.length > 0 ? `${imageDataArray.length}枚の画像も添付されました。` : ''}内容を確認次第、ご登録いただいたメールアドレスにご連絡いたします。`
        )
        onClose()
      } else {
        toast({
          title: "送信失敗",
          description: res.error || "エラーが発生しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Contact form error:", error)
      toast({
        title: "送信失敗",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setContactSending(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">お問い合わせフォーム</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <form onSubmit={handleContactSubmit} className="space-y-4">
          {/* お名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
            <input
              name="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="お名前を入力してください"
              required
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <input
              name="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="メールアドレスを入力してください"
              required
            />
          </div>

          {/* お問い合わせ種別 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ種別</label>
            <select 
              name="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">選択してください</option>
              <option value="bug">アプリの不具合</option>
              <option value="store">店舗情報について</option>
              <option value="usage">使い方がわからない</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* お問い合わせ内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容</label>
            <textarea
              name="message"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="お問い合わせ内容を詳しくご記入ください"
              required
            />
            <p className="text-xs text-gray-500 mt-2">※ お問い合わせは support@newce.co.jp に送信されます</p>
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像を添付 ({selectedImages.length}/5)
            </label>
            
            <div className="space-y-4">
              {/* アップロードエリア */}
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  id="image-upload"
                  onChange={handleImageSelect}
                  disabled={selectedImages.length >= 5}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                    selectedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {selectedImages.length >= 5 ? '画像を追加（上限到達）' : '画像を追加'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF, WebP形式（各ファイル最大5MB、最大5枚まで）
                </p>
              </div>

              {/* 画像プレビューエリア */}
              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      選択された画像 ({selectedImages.length}枚)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllImages}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      すべて削除
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`プレビュー ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* 画像情報オーバーレイ */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-md">
                          <p className="text-xs truncate">{selectedImages[index]?.name}</p>
                          <p className="text-xs">
                            {(selectedImages[index]?.size / 1024 / 1024).toFixed(2)}MB
                          </p>
                        </div>
                        
                        {/* 削除ボタン */}
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* アップロード進行状況 */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>アップロード中...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={contactSending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
          >
            {contactSending ? 
              uploadProgress > 0 ? `アップロード中... ${Math.round(uploadProgress)}%` : "送信中..." 
              : "送信する"
            }
          </Button>
        </form>
      </div>
    </div>
  )
}

