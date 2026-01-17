import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Star, Bell } from "lucide-react"
import Navigation from "@/components/navigation"

export default function SubscriptionPage() {
  const benefits = [
    {
      icon: Star,
      title: "優先予約",
      description: "人気店舗の予約を一般ユーザーより早く取ることができます",
    },
    {
      icon: Check,
      title: "確約予約",
      description: "対象店舗で確実に席を確保できる特別枠をご利用いただけます",
    },
    {
      icon: Bell,
      title: "キャンセル待ち通知",
      description: "満席の店舗でキャンセルが出た際に優先的に通知を受け取れます",
    },
    {
      icon: Crown,
      title: "会員限定割引",
      description: "対象店舗で10-20%の割引特典をご利用いただけます",
    },
  ]

  const plans = [
    {
      name: "ベーシック",
      price: "¥980",
      period: "/月",
      features: ["優先予約", "キャンセル待ち通知", "月3回まで会員割引"],
      popular: false,
    },
    {
      name: "プレミアム",
      price: "¥1,980",
      period: "/月",
      features: ["すべてのベーシック特典", "確約予約", "無制限会員割引", "専用サポート"],
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold">サブスク会員特典</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Current Status */}
        <Card className="border-gold-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold-100 rounded-full">
                <Crown className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <h3 className="font-semibold">現在のプラン</h3>
                <p className="text-sm text-gray-600">プレミアム会員</p>
                <p className="text-xs text-gray-500">次回更新: 2024年2月15日</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>会員特典一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <div key={index} className="flex gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{benefit.title}</h4>
                      <p className="text-xs text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>今月の利用状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">8</p>
                <p className="text-xs text-gray-600">優先予約利用</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">¥2,400</p>
                <p className="text-xs text-gray-600">割引節約額</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-xs text-gray-600">確約予約利用</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">12</p>
                <p className="text-xs text-gray-600">通知受信数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Options */}
        <div>
          <h3 className="text-lg font-semibold mb-4">プラン変更</h3>
          <div className="space-y-3">
            {plans.map((plan, index) => (
              <Card key={index} className={plan.popular ? "border-blue-200 bg-blue-50/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      {plan.popular && <Badge className="bg-blue-100 text-blue-800">人気</Badge>}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold">{plan.price}</span>
                      <span className="text-sm text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    disabled={plan.name === "プレミアム"}
                  >
                    {plan.name === "プレミアム" ? "現在のプラン" : "プラン変更"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Management Options */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full bg-transparent">
            支払い方法を変更
          </Button>
          <Button variant="outline" className="w-full text-red-600 border-red-200 bg-transparent">
            サブスクリプションを解約
          </Button>
        </div>
      </div>
    </div>
  )
}
