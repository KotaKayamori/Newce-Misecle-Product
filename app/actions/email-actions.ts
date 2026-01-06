"use server"

import sgMail from "@sendgrid/mail"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// --- 初期化 ---
const apiKey = process.env.SENDGRID_API_KEY
if (!apiKey) {
  console.error("SENDGRID_API_KEY is not set")
} else {
  try {
    sgMail.setApiKey(apiKey)
  } catch (e) {
    console.error("Failed to set SendGrid API key:", e)
  }
}

// サーバーアクション用のSupabaseクライアント作成関数
function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // サーバーアクションではCookieの設定は不要
        },
        remove(name: string, options: any) {
          // サーバーアクションではCookieの削除は不要
        },
      },
    }
  )
}

// 現在のユーザーを取得する関数（改良版）
async function getCurrentUser() {
  try {
    const supabase = createServerSupabaseClient()
    
    // 現在の認証済みユーザーを取得
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn("Auth error:", error.message)
      return null
    }

    if (!user) {
      console.log("No authenticated user found")
      return null
    }

    console.log("Successfully fetched user:", { id: user.id, email: user.email })
    return user
  } catch (error) {
    console.warn("Failed to get current user:", error)
    return null
  }
}

// ユーザープロフィールを取得する関数
async function getUserProfile(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("user_profiles")
      .select("name, username")
      .eq("id", userId)
      .single()
    
    if (error) {
      console.warn("Failed to fetch user profile:", error.message)
      return null
    }

    return data
  } catch (error) {
    console.warn("Error fetching user profile:", error)
    return null
  }
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
  extra?: { 
    cc?: string | string[]
    attachments?: Array<{
      filename: string
      content: string
      type: string
    }>
  }
) {
  const from = process.env.SENDGRID_VERIFIED_SENDER_EMAIL
  if (!from) {
    console.error("SENDGRID_VERIFIED_SENDER_EMAIL is not set")
    return { success: false, error: "送信元メール未設定" }
  }
  if (!apiKey) {
    return { success: false, error: "APIキー未設定" }
  }

  const msg: any = {
    to,
    from,
    subject,
    text,
    ...(html ? { html } : {}),
  }
  
  if (extra?.cc) msg.cc = extra.cc
  
  // 複数添付ファイルの追加
  if (extra?.attachments && extra.attachments.length > 0) {
    msg.attachments = extra.attachments.map(attachment => ({
      filename: attachment.filename,
      content: attachment.content,
      type: attachment.type,
      disposition: 'attachment'
    }))
  }

  console.log("Sending email:", { 
    to, 
    subject, 
    from, 
    cc: msg.cc,
    attachmentCount: msg.attachments?.length || 0,
    attachmentNames: msg.attachments?.map((a: any) => a.filename) || []
  })
  
  try {
    await sgMail.send(msg)
    console.log("Email sent successfully")
    return { success: true }
  } catch (error: any) {
    let detail = "Failed to send email"
    if (error.response?.body) {
      console.error("SendGrid error detail:", JSON.stringify(error.response.body))
      if (Array.isArray(error.response.body.errors) && error.response.body.errors[0]?.message) {
        detail = error.response.body.errors[0].message
      }
    } else {
      console.error("SendGrid error raw:", error)
    }
    return { success: false, error: detail }
  }
}

export async function sendSupportInquiryAction(params: {
  name: string
  email: string
  category: string
  message: string
  imageDataArray?: Array<{
    filename: string
    content: string
    type: string
  }> | undefined
}) {
  console.log("Support inquiry action called with:", {
    name: params.name ? "provided" : "empty",
    email: params.email ? "provided" : "empty",
    category: params.category ? "provided" : "empty",
    message: params.message ? `${params.message.length} chars` : "empty",
    imageCount: params.imageDataArray?.length || 0
  })

  const support = process.env.SENDGRID_SUPPORT_EMAIL
  if (!support) {
    console.error("SENDGRID_SUPPORT_EMAIL is not set")
    return { success: false, error: "サポート宛メールアドレス未設定" }
  }
  
  const { name, email, category, message, imageDataArray } = params
  const subject = `【Misecle】お問い合わせを受け付けました`
  
  // メール本文（複数添付ファイルの情報も含める）
  const imageInfo = imageDataArray && imageDataArray.length > 0 
    ? `\n※ 以下の画像ファイルが添付されています：\n${imageDataArray.map((img, i) => `${i + 1}. ${img.filename}`).join('\n')}\n`
    : ''
  
  const body = `平素よりMisecleをご利用いただきありがとうございます。
  お問い合わせ内容を以下の通り受け付けました。

  お名前: ${name || "(未入力)"} 様
  メールアドレス: ${email || "(未入力)"} 
  お問い合わせ種別: ${category || "(未選択)"} 
  お問い合わせ内容:
  ${message}${imageInfo}

  今後ともMisecleをよろしくお願いいたします。

  ※本メールは送信専用です。直接のご返信には対応しておりません。
  追加情報やご要望がございましたら、別途「お問い合わせ」フォームよりお送りください。

  ――――――――――――――――――
  株式会社Newce
  ――――――――――――――――――`

  const recipients: string[] = [support]
  if (email) recipients.push(email)

  // 複数添付ファイルの準備
  const attachments = imageDataArray && imageDataArray.length > 0 ? imageDataArray : undefined

  return await sendEmail(recipients, subject, body, undefined, { attachments })
}

export async function sendBugReportAction(params: { message: string; name?: string }) {
  console.log("Bug report action called with:", {
    message: params.message ? `${params.message.length} chars` : "empty",
    name: params.name ? "provided" : "not provided"
  })

  const support = process.env.SENDGRID_SUPPORT_EMAIL
  if (!support) {
    console.error("SENDGRID_SUPPORT_EMAIL is not set")
    return { success: false, error: "サポート宛メールアドレス未設定" }
  }
  
  const { message, name: nameOverride } = params

  // 認証ユーザー取得（改良版）
  let userEmail: string | null = null
  let userName: string | null = null
  
  try {
    const user = await getCurrentUser()
    
    if (user) {
      console.log("Successfully fetched user for bug report:", { id: user.id, email: user.email })
      userEmail = user.email ?? null
      
      // ユーザープロフィールを取得
      const profile = await getUserProfile(user.id)
      userName = profile?.name || user.user_metadata?.name || null
    } else {
      console.log("No authenticated user found for bug report")
    }
  } catch (e) {
    console.warn("Failed to fetch user for bug report:", e)
  }

  const effectiveName = nameOverride || userName || "(未入力)"
  const receivedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })

  const subject = `【Misecle】不具合・改善要望を受け付けました`
  const body = `平素よりMisecleをご利用いただきありがとうございます。
  以下の内容で不具合報告・改善要望を受け付けました。

  受付日時: ${receivedAt}
  報告者名: ${effectiveName}
  ${userEmail ? `報告者メール: ${userEmail}` : ''}
  報告内容:
  ${message}

  ※本メールは送信専用です。直接のご返信には対応しておりません。
  追加情報がございましたら、再度フォームよりご連絡ください。

  ――――――――――――――――――
  株式会社Newce
  ――――――――――――――――――`

  const recipients: string[] = [support]
  if (userEmail) {
    recipients.push(userEmail)
    console.log("Added user email to recipients:", userEmail)
  }

  console.log("Sending bug report to:", recipients)
  return await sendEmail(recipients, subject, body)
}