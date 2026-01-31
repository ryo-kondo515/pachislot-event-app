import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FAVORITE_ACTORS: '@favorite_actors',
  FAVORITE_AREAS: '@favorite_areas',
  FAVORITE_MACHINES: '@favorite_machines',
  NOTIFICATION_SETTINGS: '@notification_settings',
} as const;

/**
 * お気に入り演者を保存
 */
export async function saveFavoriteActors(actorIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.FAVORITE_ACTORS, JSON.stringify(actorIds));
  } catch (error) {
    console.error('Failed to save favorite actors:', error);
    throw error;
  }
}

/**
 * お気に入り演者を読み込み
 */
export async function loadFavoriteActors(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITE_ACTORS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorite actors:', error);
    return [];
  }
}

/**
 * お気に入りエリアを保存
 */
export async function saveFavoriteAreas(areaIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.FAVORITE_AREAS, JSON.stringify(areaIds));
  } catch (error) {
    console.error('Failed to save favorite areas:', error);
    throw error;
  }
}

/**
 * お気に入りエリアを読み込み
 */
export async function loadFavoriteAreas(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITE_AREAS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorite areas:', error);
    return [];
  }
}

/**
 * お気に入り機種を保存
 */
export async function saveFavoriteMachines(machineIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.FAVORITE_MACHINES, JSON.stringify(machineIds));
  } catch (error) {
    console.error('Failed to save favorite machines:', error);
    throw error;
  }
}

/**
 * お気に入り機種を読み込み
 */
export async function loadFavoriteMachines(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITE_MACHINES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorite machines:', error);
    return [];
  }
}

/**
 * 通知設定を保存
 */
export async function saveNotificationSettings(settings: any): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    throw error;
  }
}

/**
 * 通知設定を読み込み
 */
export async function loadNotificationSettings(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.NOTIFICATION_SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return null;
  }
}

/**
 * すべてのデータをクリア（デバッグ用）
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
}
