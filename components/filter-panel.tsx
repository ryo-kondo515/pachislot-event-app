import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import { HotLevel } from '@/types';
import { getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';

export interface FilterOptions {
  hotLevels: HotLevel[];
  areas: string[];
  dateRange?: { start: string; end: string };
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

export function FilterPanel({ filters, onFilterChange, onClose }: FilterPanelProps) {
  const colors = useColors();

  const toggleHotLevel = (level: HotLevel) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newLevels = filters.hotLevels.includes(level)
      ? filters.hotLevels.filter(l => l !== level)
      : [...filters.hotLevels, level];
    
    onFilterChange({ ...filters, hotLevels: newLevels });
  };

  const toggleArea = (area: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newAreas = filters.areas.includes(area)
      ? filters.areas.filter(a => a !== area)
      : [...filters.areas, area];
    
    onFilterChange({ ...filters, areas: newAreas });
  };

  const clearFilters = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onFilterChange({ hotLevels: [], areas: [] });
  };

  const availableAreas = ['新宿区', '渋谷区', '豊島区', '台東区', '千代田区', '港区', '杉並区', '練馬区'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>フィルター</Text>
        <Pressable
          onPress={clearFilters}
          style={({ pressed }: { pressed: boolean }) => [
            styles.clearButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.clearButtonText, { color: colors.primary }]}>クリア</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* アツさレベルフィルター */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>アツさレベル</Text>
          <View style={styles.chipContainer}>
            {[5, 4, 3, 2, 1].map((level) => {
              const isSelected = filters.hotLevels.includes(level as HotLevel);
              return (
                <Pressable
                  key={level}
                  onPress={() => toggleHotLevel(level as HotLevel)}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? getHotLevelColor(level as HotLevel)
                        : colors.surface,
                      borderColor: getHotLevelColor(level as HotLevel),
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
                    {getHotLevelLabel(level as HotLevel)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* エリアフィルター */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>エリア</Text>
          <View style={styles.chipContainer}>
            {availableAreas.map((area) => {
              const isSelected = filters.areas.includes(area);
              return (
                <Pressable
                  key={area}
                  onPress={() => toggleArea(area)}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: colors.primary,
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
                    {area}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={onClose}
          style={({ pressed }: { pressed: boolean }) => [
            styles.applyButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.applyButtonText}>適用する</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
