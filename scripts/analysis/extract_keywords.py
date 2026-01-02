import os
from dotenv import load_dotenv
from supabase import create_client, Client
import google.genai as genai
import json

load_dotenv()

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)


def extract_keywords(title: str, caption: str) -> list[dict]:
    prompt = (
        "以下のタイトルとキャプションから日本語で検索に使われそうなキーワード（単語）を全て抽出し、"
        "各キーワードについて「original（標準表記）」「hiragana（ひらがな表記）」「romaji（ローマ字表記）」の3つを持つJSON配列として出力してください。"
        '例: [{"original": "寿司", "hiragana": "すし", "romaji": "sushi"}, ...]\n'
        f"タイトル: {title}\n"
        f"キャプション: {caption}\n"
        "キーワード:"
    )
    response = client.models.generate_content(model="gemini-2.5-flash", contents=[prompt])
    # Geminiの返答からJSON部分を抽出
    text = response.text.strip()
    print(f"Raw response: {text}")
    # コードブロック（```json ... ```）を除去
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    # 返答に「キーワード:」が含まれていれば除去
    if text.startswith("キーワード:"):
        text = text[len("キーワード:") :].strip()
    # JSONとしてパース
    try:
        keywords = json.loads(text)
    except Exception:
        # 万一JSONでなければ、手動で抽出
        keywords = []
    return keywords


def main():
    videos = supabase.table("videos").select("id, title, caption").execute().data

    for video in videos:
        title = video.get("title") or ""
        caption = video.get("caption") or ""

        try:
            keywords = extract_keywords(title, caption)
            supabase.table("videos").update({"keywords": keywords}).eq("id", video["id"]).execute()
            print(f"Updated video {video['id']} with keywords: {keywords}")
        except Exception as e:
            print(f"Error processing video {video['id']}: {e}")


if __name__ == "__main__":
    main()
