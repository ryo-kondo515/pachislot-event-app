import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform, Text, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { loadSearchHistory, saveSearchHistory } from '@/lib/storage';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
}

export function SearchBar({ placeholder = '店舗名で検索', onSearch, onClear }: SearchBarProps) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSearchHistory().then(setSearchHistory);
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text);
    setShowHistory(false);

    // 検索履歴に保存（空文字以外）
    if (text.trim()) {
      saveSearchHistory(text.trim()).then(() => {
        loadSearchHistory().then(setSearchHistory);
      });
    }
  };

  const handleFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleHistorySelect = (historyQuery: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowHistory(false);
  };

  const handleClear = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setQuery('');
    onSearch('');
    onClear?.();
  };

  return (
    <View>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={(text) => setQuery(text)}
          onSubmitEditing={() => handleSearch(query)}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* 検索履歴 */}
      {showHistory && searchHistory.length > 0 && (
        <ScrollView
          style={[styles.historyContainer, { backgroundColor: colors.surface }]}
          keyboardShouldPersistTaps="handled"
        >
          {searchHistory.map((historyQuery, index) => (
            <Pressable
              key={index}
              onPress={() => handleHistorySelect(historyQuery)}
              style={({ pressed }) => [
                styles.historyItem,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.background },
              ]}
            >
              <IconSymbol name="clock.fill" size={16} color={colors.muted} />
              <Text style={[styles.historyText, { color: colors.foreground }]}>
                {historyQuery}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  historyContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
  },
});
