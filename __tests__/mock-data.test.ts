import { describe, it, expect } from 'vitest';
import {
  mockStores,
  mockActors,
  mockEvents,
  getHotLevelColor,
  getHotLevelSize,
  getHotLevelLabel,
  getStoreById,
  getEventsByStoreId,
  getActorById,
  getStoreDetail,
} from '../data/mock-data';
import { HotLevel } from '../types';

describe('Mock Data', () => {
  describe('mockStores', () => {
    it('should have at least one store', () => {
      expect(mockStores.length).toBeGreaterThan(0);
    });

    it('should have valid store properties', () => {
      mockStores.forEach((store) => {
        expect(store.id).toBeDefined();
        expect(store.name).toBeDefined();
        expect(store.address).toBeDefined();
        expect(store.latitude).toBeGreaterThan(0);
        expect(store.longitude).toBeGreaterThan(0);
        expect(store.hotLevel).toBeGreaterThanOrEqual(1);
        expect(store.hotLevel).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('mockActors', () => {
    it('should have at least one actor', () => {
      expect(mockActors.length).toBeGreaterThan(0);
    });

    it('should have valid actor properties', () => {
      mockActors.forEach((actor) => {
        expect(actor.id).toBeDefined();
        expect(actor.name).toBeDefined();
        expect(actor.rankScore).toBeGreaterThanOrEqual(0);
        expect(actor.rankScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('mockEvents', () => {
    it('should have at least one event', () => {
      expect(mockEvents.length).toBeGreaterThan(0);
    });

    it('should have valid event properties', () => {
      mockEvents.forEach((event) => {
        expect(event.id).toBeDefined();
        expect(event.storeId).toBeDefined();
        expect(event.actorId).toBeDefined();
        expect(event.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(event.sourceUrl).toBeDefined();
        expect(event.sourceName).toBeDefined();
      });
    });

    it('should reference valid stores and actors', () => {
      mockEvents.forEach((event) => {
        const store = getStoreById(event.storeId);
        const actor = getActorById(event.actorId);
        expect(store).toBeDefined();
        expect(actor).toBeDefined();
      });
    });
  });
});

describe('Hot Level Utilities', () => {
  describe('getHotLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getHotLevelColor(5)).toBe('#FF1744');
      expect(getHotLevelColor(4)).toBe('#FF9100');
      expect(getHotLevelColor(3)).toBe('#FFD600');
      expect(getHotLevelColor(2)).toBe('#00E5FF');
      expect(getHotLevelColor(1)).toBe('#2979FF');
    });
  });

  describe('getHotLevelSize', () => {
    it('should return larger sizes for higher levels', () => {
      const size5 = getHotLevelSize(5);
      const size4 = getHotLevelSize(4);
      const size3 = getHotLevelSize(3);
      const size2 = getHotLevelSize(2);
      const size1 = getHotLevelSize(1);

      expect(size5).toBeGreaterThan(size4);
      expect(size4).toBeGreaterThan(size3);
      expect(size3).toBeGreaterThan(size2);
      expect(size2).toBeGreaterThan(size1);
    });
  });

  describe('getHotLevelLabel', () => {
    it('should return correct labels for each level', () => {
      expect(getHotLevelLabel(5)).toBe('超アツ');
      expect(getHotLevelLabel(4)).toBe('アツ');
      expect(getHotLevelLabel(3)).toBe('やや熱');
      expect(getHotLevelLabel(2)).toBe('普通');
      expect(getHotLevelLabel(1)).toBe('低');
    });
  });
});

describe('Data Access Functions', () => {
  describe('getStoreById', () => {
    it('should return store for valid id', () => {
      const store = getStoreById('store-1');
      expect(store).toBeDefined();
      expect(store?.id).toBe('store-1');
    });

    it('should return undefined for invalid id', () => {
      const store = getStoreById('invalid-id');
      expect(store).toBeUndefined();
    });
  });

  describe('getActorById', () => {
    it('should return actor for valid id', () => {
      const actor = getActorById('actor-1');
      expect(actor).toBeDefined();
      expect(actor?.id).toBe('actor-1');
    });

    it('should return undefined for invalid id', () => {
      const actor = getActorById('invalid-id');
      expect(actor).toBeUndefined();
    });
  });

  describe('getEventsByStoreId', () => {
    it('should return events for store with events', () => {
      const events = getEventsByStoreId('store-1');
      expect(events.length).toBeGreaterThan(0);
      events.forEach((event) => {
        expect(event.storeId).toBe('store-1');
      });
    });

    it('should return empty array for store without events', () => {
      const events = getEventsByStoreId('store-9');
      expect(events).toEqual([]);
    });
  });

  describe('getStoreDetail', () => {
    it('should return store detail with events and actors', () => {
      const detail = getStoreDetail('store-1');
      expect(detail).toBeDefined();
      expect(detail?.id).toBe('store-1');
      expect(detail?.events).toBeDefined();
      expect(detail?.events.length).toBeGreaterThan(0);
      detail?.events.forEach((event) => {
        expect(event.actor).toBeDefined();
        expect(event.actor.name).toBeDefined();
      });
    });

    it('should return null for invalid store id', () => {
      const detail = getStoreDetail('invalid-id');
      expect(detail).toBeNull();
    });
  });
});
