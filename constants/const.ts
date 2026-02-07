export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// 日本の地方区分
export interface Region {
  id: string;
  name: string;
  prefectures: string[];  // 住所に含まれる都道府県名
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const REGIONS: Region[] = [
  {
    id: 'hokkaido',
    name: '北海道',
    prefectures: ['北海道'],
    center: { latitude: 43.0642, longitude: 141.3469 },
    zoom: 7,
    bounds: { north: 45.5, south: 41.3, east: 146.0, west: 139.3 },
  },
  {
    id: 'tohoku',
    name: '東北',
    prefectures: ['青森', '岩手', '宮城', '秋田', '山形', '福島'],
    center: { latitude: 38.7223, longitude: 140.4694 },
    zoom: 7,
    bounds: { north: 41.6, south: 36.8, east: 142.1, west: 139.5 },
  },
  {
    id: 'kanto',
    name: '関東',
    prefectures: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'],
    center: { latitude: 35.6812, longitude: 139.7671 },
    zoom: 8,
    bounds: { north: 37.0, south: 34.8, east: 140.9, west: 138.4 },
  },
  {
    id: 'chubu',
    name: '中部',
    prefectures: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知'],
    center: { latitude: 36.2048, longitude: 138.2529 },
    zoom: 7,
    bounds: { north: 38.6, south: 34.5, east: 139.9, west: 136.0 },
  },
  {
    id: 'kinki',
    name: '近畿',
    prefectures: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'],
    center: { latitude: 34.6937, longitude: 135.5023 },
    zoom: 8,
    bounds: { north: 35.8, south: 33.4, east: 136.9, west: 134.0 },
  },
  {
    id: 'chugoku',
    name: '中国',
    prefectures: ['鳥取', '島根', '岡山', '広島', '山口'],
    center: { latitude: 34.6618, longitude: 133.9350 },
    zoom: 8,
    bounds: { north: 35.6, south: 33.7, east: 135.5, west: 130.8 },
  },
  {
    id: 'shikoku',
    name: '四国',
    prefectures: ['徳島', '香川', '愛媛', '高知'],
    center: { latitude: 33.8416, longitude: 133.2812 },
    zoom: 8,
    bounds: { north: 34.5, south: 32.7, east: 134.8, west: 132.4 },
  },
  {
    id: 'kyushu',
    name: '九州・沖縄',
    prefectures: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'],
    center: { latitude: 32.7503, longitude: 130.7079 },
    zoom: 7,
    bounds: { north: 34.0, south: 24.0, east: 132.0, west: 123.5 },
  },
];
