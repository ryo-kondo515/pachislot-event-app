import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../lib/location-utils';

describe('location-utils', () => {
  describe('calculateDistance', () => {
    it('東京駅から新宿駅までの距離を計算する', () => {
      // 東京駅: 35.6812, 139.7671
      // 新宿駅: 35.6896, 139.7006
      const distance = calculateDistance(35.6812, 139.7671, 35.6896, 139.7006);
      
      // 実際の距離は約6.5km
      expect(distance).toBeGreaterThan(6);
      expect(distance).toBeLessThan(7);
    });

    it('同じ地点の距離は0になる', () => {
      const distance = calculateDistance(35.6812, 139.7671, 35.6812, 139.7671);
      expect(distance).toBe(0);
    });

    it('距離は小数点第1位まで丸められる', () => {
      const distance = calculateDistance(35.6812, 139.7671, 35.6896, 139.7006);
      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
  });

  describe('formatDistance', () => {
    it('1km未満はメートル表示', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
    });

    it('1km以上はキロメートル表示', () => {
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(10.2)).toBe('10.2km');
    });

    it('ちょうど1kmの場合', () => {
      expect(formatDistance(1.0)).toBe('1km');
    });
  });
});
