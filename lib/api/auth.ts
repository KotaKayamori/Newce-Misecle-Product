import { supabase } from "@/lib/supabase"

/**
 * メールアドレスが既に登録済みかチェックする
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // auth.users テーブルから直接チェックはできないため、
    // サインインを試行してユーザーの存在を確認する方法を使用
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-for-check' // ダミーパスワード
    })

    // パスワードが間違っている場合は 'Invalid login credentials' エラーが返される
    // これはユーザーが存在することを意味する
    if (error && error.message === 'Invalid login credentials') {
      return true // ユーザー存在
    }

    // その他のエラー（メール未確認など）もユーザーが存在する可能性
    if (error && error.message.includes('Email not confirmed')) {
      return true // ユーザー存在（未確認）
    }

    // ログインが成功した場合（本来起こらない）
    if (data.user) {
      // 即座にログアウト
      await supabase.auth.signOut()
      return true
    }

    return false
  } catch (error) {
    console.error('Email check error:', error)
    // エラーが発生した場合は安全側に倒して存在するとみなす
    return true
  }
}

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