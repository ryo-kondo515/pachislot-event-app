import { Store, Actor, Event, HotLevel } from '@/types';

// 演者データ
export const mockActors: Actor[] = [
  { id: 'actor-1', name: 'ドリラーマグロ', rankScore: 95 },
  { id: 'actor-2', name: 'スロカイザー', rankScore: 88 },
  { id: 'actor-3', name: 'パチンコ太郎', rankScore: 82 },
  { id: 'actor-4', name: '必勝本ライター', rankScore: 78 },
  { id: 'actor-5', name: 'ジャグラー女子', rankScore: 75 },
  { id: 'actor-6', name: 'スロット番長', rankScore: 72 },
  { id: 'actor-7', name: 'パチスロ王子', rankScore: 68 },
  { id: 'actor-8', name: '設定師匠', rankScore: 65 },
];

// 店舗データ（東京周辺）
export const mockStores: Store[] = [
  {
    id: 'store-1',
    name: 'パチンコ新宿エース',
    address: '東京都新宿区歌舞伎町1-1-1',
    latitude: 35.6938,
    longitude: 139.7034,
    openingHours: '10:00-23:00',
    machineCount: 500,
    isPremium: true,
    hotLevel: 5,
  },
  {
    id: 'store-2',
    name: 'スロット渋谷センター',
    address: '東京都渋谷区道玄坂2-2-2',
    latitude: 35.6580,
    longitude: 139.7016,
    openingHours: '10:00-23:00',
    machineCount: 350,
    isPremium: false,
    hotLevel: 4,
  },
  {
    id: 'store-3',
    name: 'パチスロ池袋キング',
    address: '東京都豊島区東池袋3-3-3',
    latitude: 35.7295,
    longitude: 139.7109,
    openingHours: '09:00-23:00',
    machineCount: 420,
    isPremium: true,
    hotLevel: 5,
  },
  {
    id: 'store-4',
    name: 'スロット上野ホール',
    address: '東京都台東区上野4-4-4',
    latitude: 35.7141,
    longitude: 139.7774,
    openingHours: '10:00-22:30',
    machineCount: 280,
    isPremium: false,
    hotLevel: 3,
  },
  {
    id: 'store-5',
    name: 'パチンコ秋葉原',
    address: '東京都千代田区外神田5-5-5',
    latitude: 35.7022,
    longitude: 139.7741,
    openingHours: '10:00-23:00',
    machineCount: 200,
    isPremium: false,
    hotLevel: 2,
  },
  {
    id: 'store-6',
    name: 'スロット品川グランド',
    address: '東京都港区高輪6-6-6',
    latitude: 35.6284,
    longitude: 139.7387,
    openingHours: '10:00-23:00',
    machineCount: 380,
    isPremium: true,
    hotLevel: 4,
  },
  {
    id: 'store-7',
    name: 'パチスロ六本木',
    address: '東京都港区六本木7-7-7',
    latitude: 35.6627,
    longitude: 139.7313,
    openingHours: '11:00-24:00',
    machineCount: 150,
    isPremium: false,
    hotLevel: 3,
  },
  {
    id: 'store-8',
    name: 'スロット錦糸町',
    address: '東京都墨田区錦糸8-8-8',
    latitude: 35.6969,
    longitude: 139.8142,
    openingHours: '10:00-22:00',
    machineCount: 320,
    isPremium: false,
    hotLevel: 2,
  },
  {
    id: 'store-9',
    name: 'パチンコ吉祥寺',
    address: '東京都武蔵野市吉祥寺本町9-9-9',
    latitude: 35.7030,
    longitude: 139.5795,
    openingHours: '10:00-23:00',
    machineCount: 250,
    isPremium: false,
    hotLevel: 1,
  },
  {
    id: 'store-10',
    name: 'スロット立川メガ',
    address: '東京都立川市曙町10-10-10',
    latitude: 35.6980,
    longitude: 139.4142,
    openingHours: '09:00-23:00',
    machineCount: 600,
    isPremium: true,
    hotLevel: 5,
  },
];

// イベントデータ
export const mockEvents: Event[] = [
  {
    id: 'event-1',
    storeId: 'store-1',
    actorId: 'actor-1',
    eventDate: '2026-02-01',
    sourceUrl: 'https://drillermaguro.com/event/1',
    sourceName: 'ドリラーマグロ公式',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-2',
    storeId: 'store-1',
    actorId: 'actor-2',
    eventDate: '2026-02-01',
    sourceUrl: 'https://hall-navi.com/event/2',
    sourceName: 'ホールナビ',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-3',
    storeId: 'store-3',
    actorId: 'actor-1',
    eventDate: '2026-02-02',
    sourceUrl: 'https://drillermaguro.com/event/3',
    sourceName: 'ドリラーマグロ公式',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-4',
    storeId: 'store-2',
    actorId: 'actor-3',
    eventDate: '2026-02-01',
    sourceUrl: 'https://offme.jp/event/4',
    sourceName: 'オフミー',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-5',
    storeId: 'store-6',
    actorId: 'actor-4',
    eventDate: '2026-02-03',
    sourceUrl: 'https://hall-navi.com/event/5',
    sourceName: 'ホールナビ',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-6',
    storeId: 'store-10',
    actorId: 'actor-5',
    eventDate: '2026-02-01',
    sourceUrl: 'https://touslo777souko.blog.jp/event/6',
    sourceName: '闘スロ777倉庫',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-7',
    storeId: 'store-10',
    actorId: 'actor-6',
    eventDate: '2026-02-01',
    sourceUrl: 'https://hall-navi.com/event/7',
    sourceName: 'ホールナビ',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
  {
    id: 'event-8',
    storeId: 'store-4',
    actorId: 'actor-7',
    eventDate: '2026-02-02',
    sourceUrl: 'https://offme.jp/event/8',
    sourceName: 'オフミー',
    scrapedAt: '2026-01-31T00:00:00Z',
  },
];

// アツさレベルに応じたピンの色を取得
export const getHotLevelColor = (level: HotLevel): string => {
  const colors: Record<HotLevel, string> = {
    5: '#FF1744', // 超アツ - ネオンレッド
    4: '#FF9100', // アツ - オレンジ
    3: '#FFD600', // やや熱 - イエロー
    2: '#00E5FF', // 普通 - シアン
    1: '#2979FF', // 低 - ブルー
  };
  return colors[level];
};

// アツさレベルに応じたピンのサイズを取得
export const getHotLevelSize = (level: HotLevel): number => {
  const sizes: Record<HotLevel, number> = {
    5: 48,
    4: 42,
    3: 36,
    2: 32,
    1: 28,
  };
  return sizes[level];
};

// アツさレベルのラベルを取得
export const getHotLevelLabel = (level: HotLevel): string => {
  const labels: Record<HotLevel, string> = {
    5: '超アツ',
    4: 'アツ',
    3: 'やや熱',
    2: '普通',
    1: '低',
  };
  return labels[level];
};

// 店舗IDから店舗詳細を取得
export const getStoreById = (storeId: string): Store | undefined => {
  return mockStores.find(store => store.id === storeId);
};

// 店舗IDからイベント一覧を取得
export const getEventsByStoreId = (storeId: string): Event[] => {
  return mockEvents.filter(event => event.storeId === storeId);
};

// 演者IDから演者情報を取得
export const getActorById = (actorId: string): Actor | undefined => {
  return mockActors.find(actor => actor.id === actorId);
};

// 店舗の詳細情報（イベント・演者情報付き）を取得
export const getStoreDetail = (storeId: string) => {
  const store = getStoreById(storeId);
  if (!store) return null;

  const events = getEventsByStoreId(storeId).map(event => ({
    ...event,
    actor: getActorById(event.actorId)!,
  }));

  return {
    ...store,
    events,
  };
};
