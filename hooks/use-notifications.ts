import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { saveNotificationSettings, loadNotificationSettings } from '@/lib/storage';

// 通知の表示設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  favoriteActorEvents: boolean;
  newStoreEvents: boolean;
  dailySummary: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  favoriteActorEvents: true,
  newStoreEvents: false,
  dailySummary: false,
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // 初期化：パーミッションと設定を読み込み
  useEffect(() => {
    async function initialize() {
      try {
        // 設定を読み込み
        const savedSettings = await loadNotificationSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }

        // パーミッション状態を確認
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    initialize();

    // 通知リスナーを設定
    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // パーミッションをリクエスト
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // 設定を更新
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveNotificationSettings(updated);

    // 通知が有効化された場合、パーミッションをリクエスト
    if (updated.enabled && permissionStatus !== 'granted') {
      await requestPermission();
    }
  }, [settings, permissionStatus, requestPermission]);

  // ローカル通知をスケジュール（テスト用）
  const scheduleTestNotification = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('Notifications are not supported on web');
      return;
    }

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'アツマチ',
          body: 'お気に入り演者の新規イベントが追加されました！',
          data: { type: 'actor_event', actorId: 'test-actor' },
        },
        trigger: null,
      });

      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }, [requestPermission]);

  // お気に入り演者イベント通知をスケジュール
  const scheduleActorEventNotification = useCallback(async (actorName: string, storeName: string, eventDate: string) => {
    if (Platform.OS === 'web' || !settings.enabled || !settings.favoriteActorEvents) {
      return;
    }

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${actorName}の来店イベント`,
          body: `${storeName}で${eventDate}に開催されます`,
          data: { type: 'actor_event', actorName, storeName },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to schedule actor event notification:', error);
    }
  }, [settings, requestPermission]);

  return {
    settings,
    permissionStatus,
    loading,
    requestPermission,
    updateSettings,
    scheduleTestNotification,
    scheduleActorEventNotification,
  };
}
