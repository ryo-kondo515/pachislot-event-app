import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message = '読み込み中...', size = 'large' }: LoadingStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.muted }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
