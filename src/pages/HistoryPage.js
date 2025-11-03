import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import AppText from '../shared/ui/AppText';
import BackIcon from '../shared/assets/images/Button_Back.svg';

const BRAND = '#0EA5E9';
const HEADER_H = 56;
const RADIUS = 12;

export default function HistoryPage({ navigation }) {
  const data = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: String(i + 1),
        title: `촬영 ${i + 1}`,
        summary: '임시 요약: 청구 24,800원 · 기한 10월 31일.',
        time: '2025-10-25 13:00',
      })),
    []
  );

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.item}
      accessibilityRole="button"
      onPress={() => navigation.navigate('InfoPage', { summary: item.summary })}
    >
      <View style={{ flex: 1 }}>
        <AppText size={16} tight style={styles.itemTitle}>{item.title}</AppText>
        <AppText size={14} style={styles.itemSummary} numberOfLines={1}>{item.summary}</AppText>
      </View>
      <AppText size={12} style={styles.time}>{item.time}</AppText>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right','bottom']}>
      {/* 상단 헤더: 뒤로가기 + 왼쪽 정렬 제목 */}
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <BackIcon width={24} height={24} />
        </Pressable>
        <AppText size={22} tight style={styles.headerTitle}>이용내역</AppText>
        {/* 우측 균형용 박스 */}
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  headerRow: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backBtn: {
    width: HEADER_H,
    height: HEADER_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  headerTitle: { fontWeight: '800', color: '#111', marginLeft: -10 },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTitle: { fontWeight: '800', color: '#111' },
  itemSummary: { color: '#374151', marginTop: 4 },
  time: { color: '#6B7280' },
});
