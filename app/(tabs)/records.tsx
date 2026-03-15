import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { RecordTypeIcon } from '../../components/ui/RecordTypeIcon';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Record as BabyRecord, RecordType, FeedingData, SleepData, DiaperData, MeasurementData } from '../../constants/types';

const RECORD_TYPES: Array<{ type: RecordType; label: string }> = [
  { type: 'feeding', label: '喂奶' },
  { type: 'sleep', label: '睡眠' },
  { type: 'diaper', label: '尿布' },
  { type: 'bath', label: '洗澡' },
  { type: 'temperature', label: '体温' },
  { type: 'weight', label: '体重' },
  { type: 'height', label: '身高' },
  { type: 'jaundice', label: '黄疸' },
  { type: 'medicine', label: '用药' },
  { type: 'note', label: '备注' },
];

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return '今天';
  if (isYesterday(date)) return '昨天';
  return format(date, 'MM月dd日 EEEE', { locale: zhCN });
}

function getRecordDetail(record: BabyRecord): string {
  const data = record.data as any;
  switch (record.type) {
    case 'feeding':
      const fd = data as FeedingData;
      const methodMap: Record<string, string> = {
        breast_left: '左侧母乳',
        breast_right: '右侧母乳',
        breast_both: '双侧母乳',
        bottle_formula: '配方奶',
        bottle_breast_milk: '母乳瓶喂',
        solid_food: '辅食',
      };
      let detail = methodMap[fd.method] || fd.method;
      if (fd.amount_ml) detail += ` · ${fd.amount_ml}ml`;
      if (fd.duration_minutes) detail += ` · ${fd.duration_minutes}分钟`;
      return detail;
    case 'sleep':
      if (record.ended_at) {
        const mins = Math.floor((new Date(record.ended_at).getTime() - new Date(record.started_at).getTime()) / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ''}` : `${m}分钟`;
      }
      return '睡眠中...';
    case 'diaper':
      const dd = data as DiaperData;
      const typeMap: Record<string, string> = { wet: '湿尿布', dirty: '便便', both: '混合', dry: '干净' };
      return typeMap[dd.type] || dd.type;
    case 'weight':
    case 'height':
    case 'temperature':
    case 'jaundice':
      const md = data as MeasurementData;
      return `${md.value} ${md.unit}`;
    default:
      return record.note || '';
  }
}

export default function RecordsScreen() {
  const { activeBaby } = useBabyStore();
  const { records, fetchRecords, deleteRecord } = useRecordsStore();
  const [selectedType, setSelectedType] = useState<RecordType | null>(null);

  useEffect(() => {
    if (activeBaby) fetchRecords(activeBaby.id);
  }, [activeBaby]);

  const filtered = selectedType ? records.filter(r => r.type === selectedType) : records;

  // Group by date
  const grouped = filtered.reduce((acc: {[key: string]: BabyRecord[]}, record) => {
    const dateKey = format(new Date(record.started_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(record);
    return acc;
  }, {});

  const sections: Array<{ title: string; data: BabyRecord[] }> = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({
      title: formatGroupDate(data[0].started_at),
      data,
    }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>记录</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/modals/add-record')}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedType && styles.filterChipActive]}
          onPress={() => setSelectedType(null)}
        >
          <Text style={[styles.filterLabel, !selectedType && styles.filterLabelActive]}>全部</Text>
        </TouchableOpacity>
        {RECORD_TYPES.map(item => (
          <TouchableOpacity
            key={item.type}
            style={[styles.filterChip, selectedType === item.type && styles.filterChipActive]}
            onPress={() => setSelectedType(selectedType === item.type ? null : item.type)}
          >
            <RecordTypeIcon type={item.type} size="sm" />
            <Text style={[styles.filterLabel, selectedType === item.type && styles.filterLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records List */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>还没有记录</Text>
          <Text style={styles.emptySubtitle}>点击右上角 + 开始记录宝宝的一天</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.dateHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <Animated.View entering={FadeInDown.delay(index * 30)}>
              <RecordItem record={item} onDelete={() => deleteRecord(item.id)} />
            </Animated.View>
          )}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

function RecordItem({ record, onDelete }: { record: BabyRecord; onDelete: () => void }) {
  const detail = getRecordDetail(record);

  return (
    <Card style={styles.recordCard} variant="elevated">
      <View style={styles.recordRow}>
        <RecordTypeIcon type={record.type} size="md" />
        <View style={styles.recordBody}>
          <View style={styles.recordTop}>
            <Text style={styles.recordTime}>
              {format(new Date(record.started_at), 'HH:mm')}
              {record.ended_at && ` - ${format(new Date(record.ended_at), 'HH:mm')}`}
            </Text>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
          {detail ? <Text style={styles.recordDetail}>{detail}</Text> : null}
          {record.note ? <Text style={styles.recordNote}>{record.note}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterScroll: {
    maxHeight: 56,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.primaryDark,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: 8,
  },
  dateHeader: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordCard: {
    marginBottom: 8,
    padding: 0,
    overflow: 'hidden',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  recordBody: {
    flex: 1,
  },
  recordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  recordDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recordNote: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
