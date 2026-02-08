import { useState, useEffect, useCallback } from 'react';
import {
  saveFavoriteActors,
  loadFavoriteActors,
  saveFavoriteAreas,
  loadFavoriteAreas,
  saveFavoriteMachines,
  loadFavoriteMachines,
  saveFavoriteStores,
  loadFavoriteStores,
} from '@/lib/storage';

export function useFavorites() {
  const [favoriteActors, setFavoriteActors] = useState<string[]>([]);
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>([]);
  const [favoriteMachines, setFavoriteMachines] = useState<string[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 初期データ読み込み
  useEffect(() => {
    async function loadData() {
      try {
        const [actors, areas, machines, stores] = await Promise.all([
          loadFavoriteActors(),
          loadFavoriteAreas(),
          loadFavoriteMachines(),
          loadFavoriteStores(),
        ]);
        setFavoriteActors(actors);
        setFavoriteAreas(areas);
        setFavoriteMachines(machines);
        setFavoriteStores(stores);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 演者のお気に入り切り替え
  const toggleFavoriteActor = useCallback(async (actorId: string) => {
    setFavoriteActors((prev) => {
      const newFavorites = prev.includes(actorId)
        ? prev.filter((id) => id !== actorId)
        : [...prev, actorId];
      
      saveFavoriteActors(newFavorites).catch(console.error);
      return newFavorites;
    });
  }, []);

  // エリアのお気に入り切り替え
  const toggleFavoriteArea = useCallback(async (areaId: string) => {
    setFavoriteAreas((prev) => {
      const newFavorites = prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId];
      
      saveFavoriteAreas(newFavorites).catch(console.error);
      return newFavorites;
    });
  }, []);

  // 機種のお気に入り切り替え
  const toggleFavoriteMachine = useCallback(async (machineId: string) => {
    setFavoriteMachines((prev) => {
      const newFavorites = prev.includes(machineId)
        ? prev.filter((id) => id !== machineId)
        : [...prev, machineId];
      
      saveFavoriteMachines(newFavorites).catch(console.error);
      return newFavorites;
    });
  }, []);

  // 店舗のお気に入り切り替え
  const toggleFavoriteStore = useCallback(async (storeId: string) => {
    setFavoriteStores((prev) => {
      const newFavorites = prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId];

      saveFavoriteStores(newFavorites).catch(console.error);
      return newFavorites;
    });
  }, []);

  // お気に入りかどうかをチェック
  const isFavoriteActor = useCallback(
    (actorId: string) => favoriteActors.includes(actorId),
    [favoriteActors]
  );

  const isFavoriteArea = useCallback(
    (areaId: string) => favoriteAreas.includes(areaId),
    [favoriteAreas]
  );

  const isFavoriteMachine = useCallback(
    (machineId: string) => favoriteMachines.includes(machineId),
    [favoriteMachines]
  );

  const isFavoriteStore = useCallback(
    (storeId: string) => favoriteStores.includes(storeId),
    [favoriteStores]
  );

  return {
    favoriteActors,
    favoriteAreas,
    favoriteMachines,
    favoriteStores,
    loading,
    toggleFavoriteActor,
    toggleFavoriteArea,
    toggleFavoriteMachine,
    toggleFavoriteStore,
    isFavoriteActor,
    isFavoriteArea,
    isFavoriteMachine,
    isFavoriteStore,
  };
}
