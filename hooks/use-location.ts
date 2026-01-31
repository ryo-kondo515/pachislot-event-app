import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // パーミッションをリクエスト
  const requestPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        setError('位置情報はモバイルアプリでのみ利用可能です');
        return false;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      
      if (!granted) {
        setError('位置情報の許可が必要です');
      }
      
      return granted;
    } catch (err) {
      setError('位置情報の許可リクエストに失敗しました');
      return false;
    }
  };

  // 現在地を取得
  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        setError('位置情報はモバイルアプリでのみ利用可能です');
        setLoading(false);
        return null;
      }

      // パーミッションチェック
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return null;
        }
      }

      // 現在地取得
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation: UserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(userLocation);
      setLoading(false);
      return userLocation;
    } catch (err) {
      setError('現在地の取得に失敗しました');
      setLoading(false);
      return null;
    }
  };

  return {
    location,
    loading,
    error,
    permissionGranted,
    requestPermission,
    getCurrentLocation,
  };
}
