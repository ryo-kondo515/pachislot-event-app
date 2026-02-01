import { invokeLLM } from "../_core/llm";

/**
 * 店舗名とエリアから公式ホームページのURLを検索する
 * LLMを使用して店舗の公式URLを推測する
 */
export async function findStoreOfficialUrl(storeName: string, area: string): Promise<string | null> {
  try {
    const prompt = `以下の店舗の公式ホームページのURLを教えてください。

店舗名: ${storeName}
エリア: ${area}

回答は以下の形式で返してください：
- URLが見つかった場合: URLのみを返す（例: https://example.com）
- URLが見つからなかった場合: "NOT_FOUND"と返す

注意事項:
- 必ず実在する公式ホームページのURLを返してください
- スクレイピングサイトや情報サイトのURLではなく、店舗自身が運営する公式サイトのURLを返してください
- 不確実な場合は"NOT_FOUND"と返してください`;

    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseContent = typeof result.choices[0]?.message?.content === "string" 
      ? result.choices[0].message.content 
      : "";

    const urlResult = responseContent.trim();
    
    // URLが見つからなかった場合
    if (urlResult === "NOT_FOUND" || !urlResult.startsWith("http")) {
      console.log(`[StoreUrlFinder] Official URL not found for: ${storeName}`);
      return null;
    }

    console.log(`[StoreUrlFinder] Found official URL for ${storeName}: ${urlResult}`);
    return urlResult;
  } catch (error) {
    console.error(`[StoreUrlFinder] Error finding URL for ${storeName}:`, error);
    return null;
  }
}
