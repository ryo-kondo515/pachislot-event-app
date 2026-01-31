import { invokeLLM } from "../_core/llm";
import type { ScrapedEvent } from "./drillermaguro";

/**
 * LLMを使用してHTMLからイベント情報を抽出する
 */
/**
 * HTMLをクリーンアップしてイベント情報のみを抽出
 */
function cleanHtmlForLLM(html: string): string {
  // scriptタグを削除
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  
  // styleタグを削除
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // コメントを削除
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  
  // 連続する空白を削除
  cleaned = cleaned.replace(/\s+/g, " ");
  
  return cleaned.trim();
}

export async function parseEventsWithLLM(
  html: string,
  sourceUrl: string
): Promise<ScrapedEvent[]> {
  console.log(`[LLM Parser] Parsing HTML (${html.length} bytes) from ${sourceUrl}`);

  try {
    // HTMLをクリーンアップ
    const cleanedHtml = cleanHtmlForLLM(html);
    console.log(`[LLM Parser] Cleaned HTML (${cleanedHtml.length} bytes)`);
    
    // HTMLが長すぎる場合は切り詰める（LLMのトークン制限を考慮）
    const maxLength = 100000; // 制限を引き上げ
    const truncatedHtml = cleanedHtml.length > maxLength ? cleanedHtml.substring(0, maxLength) : cleanedHtml;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `あなたはパチスロイベント情報を抽出するアシスタントです。
HTMLから以下の情報を抽出してJSON配列で返してください：
- storeName: 店舗名（文字列）
- area: エリア（都道府県名、例：東京、神奈川、大阪）
- eventDate: イベント日付（YYYY-MM-DD形式）
- eventType: イベントタイプ（例：マグロ、ジャンドリ、取材、極上、あがり）

注意事項：
1. 日付は必ずYYYY-MM-DD形式に変換してください（例：2026-01-25）
2. 年が明示されていない場合は現在の年（2026年）を使用してください
3. エリアは都道府県名のみ（「都」「県」は不要）
4. 店舗名は正確に抽出してください
5. イベント情報が見つからない場合は空の配列を返してください

返答は必ずJSON配列のみで、説明文は不要です。`,
        },
        {
          role: "user",
          content: `以下のHTMLからパチスロイベント情報を抽出してください：

\`\`\`html
${truncatedHtml}
\`\`\``,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      console.error("[LLM Parser] No content in LLM response");
      return [];
    }

    // contentが文字列か配列かをチェック
    const content = typeof message.content === "string" 
      ? message.content 
      : message.content.map(c => c.type === "text" ? c.text : "").join("");

    console.log("[LLM Parser] LLM response:", content);

    // JSONをパース
    const parsed = JSON.parse(content);
    
    // eventsキーがある場合とない場合の両方に対応
    const events = parsed.events || parsed;
    
    if (!Array.isArray(events)) {
      console.error("[LLM Parser] Response is not an array:", parsed);
      return [];
    }

    // ScrapedEvent形式に変換
    const scrapedEvents: ScrapedEvent[] = events.map((event: any) => ({
      storeName: event.storeName || "",
      area: event.area || "",
      eventDate: event.eventDate || "",
      eventType: event.eventType || "取材",
      sourceUrl: sourceUrl,
      scrapedAt: new Date(),
    }));

    console.log(`[LLM Parser] Successfully parsed ${scrapedEvents.length} events`);
    return scrapedEvents;
  } catch (error) {
    console.error("[LLM Parser] Error parsing HTML with LLM:", error);
    return [];
  }
}

/**
 * LLMを使用してCloudflareチャレンジページかどうかを判定する
 */
export async function isCloudflareChallengePage(html: string): Promise<boolean> {
  // 簡単なヒューリスティックチェック
  if (html.includes("Attention Required! | Cloudflare") || 
      html.includes("cf-error-details") ||
      html.includes("cloudflare.com/5xx-error-landing")) {
    return true;
  }
  return false;
}
