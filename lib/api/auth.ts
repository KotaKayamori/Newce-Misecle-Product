import { supabase } from "@/lib/supabase"

/**
 * より安全なメールアドレス存在チェック（RPC関数を使用）
 * このメソッドを使用する場合は、Supabaseでカスタム関数を作成する必要があります
 */
export async function checkEmailExistsRPC(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_email_exists', {
      email_input: email
    })

    if (error) {
      console.error('RPC email check error:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Email existence check failed:', error)
    return false
  }
}