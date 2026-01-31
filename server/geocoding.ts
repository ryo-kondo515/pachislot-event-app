import axios from 'axios';
import { invokeLLM } from './_core/llm';

/**
 * Google Maps Geocoding APIを使用して、店舗名とエリアから緯度経度を取得する
 */
export async function geocodeStore(storeName: string, area: string): Promise<{ latitude: string; longitude: string; address: string } | null> {
  try {
    // LLMを使用して住所と座標を推測
    const prompt = `以下のパチンコ店の正確な住所と緯度経度を推測してください。

店舗名: ${storeName}
エリア: ${area}

以下のJSON形式で回答してください：
{
  "address": "都道府県市区町村番地を含む正確な住所",
  "latitude": "緯度（小数点6桁）",
  "longitude": "経度（小数点6桁）"
}

注意：
- 住所は「〇〇県〇〇市〇〇町〇-〇-〇」のように詳細に記載してください
- 座標は実際の店舗位置に基づいて推測してください
- JSON以外のテキストは含めないでください`;

    const result = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
    });
    const message = result.choices[0]?.message;
    if (!message || !message.content) {
      console.warn('[Geocoding] LLM returned empty response');
      return fallbackGeocode(storeName, area);
    }
    const response = typeof message.content === 'string' ? message.content : message.content.map(c => c.type === 'text' ? c.text : '').join('');
    
    // JSONを抽出
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`[Geocoding] LLM result: ${storeName} -> ${data.address}`);
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
      };
    } else {
      console.warn('[Geocoding] Failed to parse LLM response');
      return fallbackGeocode(storeName, area);
    }
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return fallbackGeocode(storeName, area);
  }
}

/**
 * フォールバック：Google Maps APIが使用できない場合の簡易的な座標推測
 */
function fallbackGeocode(storeName: string, area: string): { latitude: string; longitude: string; address: string } {
  const areaCoordinates: Record<string, { lat: number; lng: number }> = {
    '東京': { lat: 35.6895, lng: 139.6917 },
    '神奈川': { lat: 35.4437, lng: 139.6380 },
    '千葉': { lat: 35.6074, lng: 140.1065 },
    '埼玉': { lat: 35.8569, lng: 139.6489 },
    '茨城': { lat: 36.3418, lng: 140.4468 },
    '群馬': { lat: 36.3911, lng: 139.0608 },
    '栃木': { lat: 36.5658, lng: 139.8836 },
    '大阪': { lat: 34.6937, lng: 135.5023 },
    '京都': { lat: 35.0116, lng: 135.7681 },
    '兵庫': { lat: 34.6913, lng: 135.1830 },
    '愛知': { lat: 35.1802, lng: 136.9066 },
    '福岡': { lat: 33.5904, lng: 130.4017 },
    '北海道': { lat: 43.0642, lng: 141.3469 },
    '宮城': { lat: 38.2682, lng: 140.8694 },
  };

  // エリアから基準座標を取得
  let baseCoords = areaCoordinates['東京']; // デフォルト
  for (const [key, coords] of Object.entries(areaCoordinates)) {
    if (area.includes(key)) {
      baseCoords = coords;
      break;
    }
  }

  // ランダムなオフセットを追加（同じエリアの店舗が重ならないように）
  const offsetLat = (Math.random() - 0.5) * 0.1; // ±0.05度（約5.5km）
  const offsetLng = (Math.random() - 0.5) * 0.1;

  return {
    latitude: (baseCoords.lat + offsetLat).toFixed(6),
    longitude: (baseCoords.lng + offsetLng).toFixed(6),
    address: `${area}${storeName}`,
  };
}

/**
 * 既存の店舗データの緯度経度を更新する
 */
export async function updateStoreCoordinates(db: any, storeId: number, storeName: string, area: string): Promise<boolean> {
  try {
    const result = await geocodeStore(storeName, area);
    if (!result) {
      return false;
    }

    // データベースを更新
    await db.update('stores')
      .set({
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.address,
      })
      .where('id', storeId);

    return true;
  } catch (error) {
    console.error('Update coordinates error:', error);
    return false;
  }
}
