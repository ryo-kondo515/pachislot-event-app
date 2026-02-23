import { useState, useCallback } from 'react';
import { Text, View, ScrollView, Pressable, Switch, StyleSheet, Platform, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useNotifications } from '@/hooks/use-notifications';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, iconColor, title, subtitle, onPress, rightElement }: SettingItemProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingItem,
        { backgroundColor: colors.surface },
        pressed && onPress && { opacity: 0.8 },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <IconSymbol name={icon as any} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && (
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      ))}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const {
    settings,
    permissionStatus,
    updateSettings,
    scheduleTestNotification,
  } = useNotifications();
  const [nearbyEventAlert, setNearbyEventAlert] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleToggle = useCallback((setter: (value: boolean) => void, value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(value);
  }, []);

  const handleOpenLink = useCallback((url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  }, []);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            設定
          </Text>
        </View>

        {/* 通知設定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>通知設定</Text>
          
          <SettingItem
            icon="bell.fill"
            iconColor={colors.primary}
            title="プッシュ通知"
            subtitle="通知を受け取る"
            rightElement={
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingItem
            icon="heart.fill"
            iconColor={colors.neonPink}
            title="お気に入り演者アラート"
            subtitle="登録演者の来店時に通知"
            rightElement={
              <Switch
                value={settings.favoriteActorEvents}
                onValueChange={(value) => updateSettings({ favoriteActorEvents: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={!settings.enabled}
              />
            }
          />

          <SettingItem
            icon="location.fill"
            iconColor={colors.neonCyan}
            title="近隣イベントアラート"
            subtitle="周辺のアツいイベント時に通知"
            rightElement={
              <Switch
                value={nearbyEventAlert}
                onValueChange={(value) => handleToggle(setNearbyEventAlert, value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={!settings.enabled}
              />
            }
          />
        </View>

        {/* 位置情報設定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>位置情報</Text>
          
          <SettingItem
            icon="location.fill"
            iconColor={colors.success}
            title="位置情報の使用"
            subtitle="現在地の取得を許可"
            rightElement={
              <Switch
                value={locationEnabled}
                onValueChange={(value) => handleToggle(setLocationEnabled, value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>アカウント</Text>
          
          <SettingItem
            icon="person.fill"
            iconColor={colors.gold}
            title="ログイン / 新規登録"
            subtitle="アカウントを作成して機能を解放"
            onPress={() => {}}
          />
        </View>

        {/* その他 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>その他</Text>
          
          <SettingItem
            icon="info.circle.fill"
            iconColor={colors.muted}
            title="利用規約"
            onPress={() => handleOpenLink('https://example.com/terms')}
          />

          <SettingItem
            icon="info.circle.fill"
            iconColor={colors.muted}
            title="プライバシーポリシー"
            onPress={() => handleOpenLink('https://example.com/privacy')}
          />

          <SettingItem
            icon="info.circle.fill"
            iconColor={colors.muted}
            title="バージョン"
            subtitle="1.0.0"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 100,
  },
});
