"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navigation from "@/components/navigation"

export default function ReservationsPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white">
        <div className="px-6 py-4 text-center">
          <h1 className="text-xl font-semibold">予約</h1>
        </div>
        <div className="px-6">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 border-0">
              <TabsTrigger
                value="current"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                現在の予約
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                過去の予約
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4">
              <div className="text-center py-12 px-6">
                <p className="text-gray-600 text-base leading-relaxed">
                  現在は、電話予約のみ対応中です。
                  <br />
                  店舗準備が整い次第、随時ネット予約機能を開放予定です。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              <div className="text-center py-12 px-6">
                <p className="text-gray-600 text-base leading-relaxed">
                  現在は、電話予約のみ対応中です。
                  <br />
                  店舗準備が整い次第、随時ネット予約機能を開放予定です。
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
