// 店舗データ
export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  machineCount: number;
  isPremium: boolean;
  hotLevel: HotLevel;
}

// アツさレベル（1-5）
export type HotLevel = 1 | 2 | 3 | 4 | 5;

// 演者データ
export interface Actor {
  id: string;
  name: string;
  rankScore: number;
  imageUrl?: string;
}

// イベントデータ
export interface Event {
  id: string;
  storeId: string;
  actorId: string;
  eventDate: string;
  sourceUrl: string;
  sourceName: string;
  scrapedAt: string;
}

// 店舗詳細（イベント・演者情報を含む）
export interface StoreDetail extends Store {
  events: EventWithActor[];
}

// イベント（演者情報付き）
export interface EventWithActor extends Event {
  actor: Actor;
}

// お気に入り演者
export interface FavoriteActor {
  userId: string;
  actorId: string;
  addedAt: string;
}

// お気に入りエリア
export interface FavoriteArea {
  userId: string;
  areaId: string;
  areaName: string;
  latitude: number;
  longitude: number;
  addedAt: string;
}

// 通知設定
export interface NotificationSettings {
  enabled: boolean;
  favoriteActorAlert: boolean;
  nearbyEventAlert: boolean;
  startTime: string; // HH:mm形式
  endTime: string;   // HH:mm形式
}

// ユーザー設定
export interface UserSettings {
  notifications: NotificationSettings;
  locationEnabled: boolean;
}

// 地図の表示領域
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ピンの色とサイズを取得するためのユーティリティ型
export interface PinStyle {
  color: string;
  size: number;
}
