import { View, Text, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import { REGIONS, Region } from '@/constants/const';

interface RegionSelectorProps {
  selectedRegion: string | null;
  onRegionChange: (regionId: string | null) => void;
  style?: ViewStyle;
}

export function RegionSelector({ selectedRegion, onRegionChange, style }: RegionSelectorProps) {
  const colors = useColors();

  const handleRegionPress = (regionId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 常にどれかの地方を選択状態にする（選択解除は不可）
    if (selectedRegion !== regionId) {
      onRegionChange(regionId);
    }
  };

  const containerStyle = Platform.OS === 'web' ? styles.containerWeb : styles.containerNative;

  return (
    <View style={[containerStyle, { backgroundColor: colors.surface }, style]}>
      <Text style={[styles.title, { color: colors.foreground }]}>地方</Text>
      <View style={styles.chipContainer}>
        {REGIONS.map((region) => {
          const isSelected = selectedRegion === region.id;
          return (
            <Pressable
              key={region.id}
              onPress={() => handleRegionPress(region.id)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.foreground,
                  },
                ]}
              >
                {region.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerNative: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 85,
  },
  containerWeb: {
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
