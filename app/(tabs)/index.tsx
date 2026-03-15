import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../../components/ui/Card';
import { BabyAvatar } from '../../components/ui/BabyAvatar';
import { RecordTypeIcon } from '../../components/ui/RecordTypeIcon';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { RecordType } from '../../constants/types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return format(new Date(dateStr), 'MM-dd HH:mm');
}

function getBabyAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const months = differenceInMonths(new Date(), birth);
  const days = differenceInDays(new Date(), birth);
  if (months < 1) return `${days}天`;
  const remainDays = days - months * 30;
  return `${months}个月${remainDays > 0 ? `${remainDays}天` : ''}`;
}

const QUICK_RECORDS: Array<{ type: RecordType; label: string }> = [
  { type: 'feeding', label: '喂奶' },
  { type: 'sleep', label: '睡眠' },
  { type: 'diaper', label: '尿布' },
  { type: 'bath', label: '洗澡' },
  { type: 'temperature', label: '体温' },
  { type: 'note', label: '备注' },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { activeBaby, fetchBabies } = useBabyStore();
  const { records, fetchRecords, getTodayRecords, getLastRecord } = useRecordsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) fetchBabies(user.id);
  }, [user]);

  useEffect(() => {
    if (activeBaby) fetchRecords(activeBaby.id);
  }, [activeBaby]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeBaby) await fetchRecords(activeBaby.id);
    setRefreshing(false);
  }, [activeBaby]);

  const todayRecords = getTodayRecords();
  const feedingCount = todayRecords.filter(r => r.type === 'feeding').length;
  const diaperCount = todayRecords.filter(r => r.type === 'diaper').length;
  const sleepRecords = todayRecords.filter(r => r.type === 'sleep' && r.ended_at);
  const sleepHours = sleepRecords.reduce((sum, r) => {
    if (!r.ended_at) return sum;
    return sum + (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 3600000;
  }, 0);

  const lastFeeding = getLastRecord('feeding');
  const lastSleep = getLastRecord('sleep');
  const lastDiaper = getLastRecord('diaper');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            {activeBaby && (
              <Text style={styles.babyAge}>
                {activeBaby.name} · {getBabyAge(activeBaby.birth_date)}
              </Text>
            )}
          </View>
          {activeBaby ? (
            <TouchableOpacity onPress={() => {}}>
              <BabyAvatar baby={activeBaby} size={52} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addBabyBtn}
              onPress={() => router.push('/modals/baby-setup')}
            >
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Last Activity Summary */}
        {activeBaby && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Card style={styles.summaryCard} variant="elevated">
              <Text style={styles.sectionTitle}>最近动态</Text>
              <View style={styles.activityRow}>
                <ActivityItem
                  type="feeding"
                  label="喂奶"
                  time={lastFeeding ? formatTimeAgo(lastFeeding.started_at) : '暂无'}
                />
                <View style={styles.divider} />
                <ActivityItem
                  type="sleep"
                  label="睡眠"
                  time={lastSleep ? formatTimeAgo(lastSleep.started_at) : '暂无'}
                />
                <View style={styles.divider} />
                <ActivityItem
                  type="diaper"
                  label="尿布"
                  time={lastDiaper ? formatTimeAgo(lastDiaper.started_at) : '暂无'}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Today Stats */}
        {activeBaby && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.statsRow}>
            <StatCard
              icon="nutrition"
              value={`${feedingCount}`}
              unit="次"
              label="喂奶"
              color={Colors.feeding}
              bg="#FFF0F5"
            />
            <StatCard
              icon="moon"
              value={sleepHours.toFixed(1)}
              unit="h"
              label="睡眠"
              color={Colors.sleep}
              bg="#F3F0FF"
            />
            <StatCard
              icon="water"
              value={`${diaperCount}`}
              unit="次"
              label="换尿布"
              color={Colors.diaper}
              bg="#EFFAF6"
            />
          </Animated.View>
        )}

        {/* Quick Record */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle2}>快速记录</Text>
          <Card variant="elevated">
            <View style={styles.quickGrid}>
              {QUICK_RECORDS.map((item, i) => (
                <TouchableOpacity
                  key={item.type}
                  style={styles.quickItem}
                  onPress={() => router.push({ pathname: '/modals/add-record', params: { type: item.type } })}
                >
                  <RecordTypeIcon type={item.type} size="md" showLabel />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* AI Tip */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/ai')}>
            <Card style={styles.aiCard} variant="colored" color="#FFF4FC">
              <View style={styles.aiRow}>
                <View style={styles.aiLeft}>
                  <View style={styles.aiIconBg}>
                    <Ionicons name="sparkles" size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.aiText}>
                    <Text style={styles.aiTitle}>AI育儿助手</Text>
                    <Text style={styles.aiSubtitle}>点击询问今日育儿问题 →</Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Records */}
        {todayRecords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle2}>今日记录</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/records')}>
                <Text style={styles.viewAll}>查看全部</Text>
              </TouchableOpacity>
            </View>
            <Card variant="elevated">
              {todayRecords.slice(0, 5).map((record, i) => (
                <View key={record.id}>
                  <View style={styles.recordRow}>
                    <RecordTypeIcon type={record.type} size="sm" />
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordType}>
                        {getRecordLabel(record.type)}
                      </Text>
                      <Text style={styles.recordTime}>
                        {format(new Date(record.started_at), 'HH:mm')}
                      </Text>
                    </View>
                    {record.note && (
                      <Text style={styles.recordNote} numberOfLines={1}>{record.note}</Text>
                    )}
                  </View>
                  {i < Math.min(todayRecords.length - 1, 4) && (
                    <View style={styles.recordDivider} />
                  )}
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityItem({ type, label, time }: { type: RecordType; label: string; time: string }) {
  return (
    <View style={styles.activityItem}>
      <RecordTypeIcon type={type} size="sm" />
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

function StatCard({ icon, value, unit, label, color, bg }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={styles.statValue}>
        <Text style={[styles.statNumber, { color }]}>{value}</Text>
        <Text style={[styles.statUnit, { color }]}>{unit}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getRecordLabel(type: RecordType): string {
  const labels: Record<RecordType, string> = {
    feeding: '喂奶',
    sleep: '睡眠',
    diaper: '换尿布',
    bath: '洗澡',
    weight: '体重',
    height: '身高',
    temperature: '体温',
    jaundice: '黄疸',
    medicine: '用药',
    note: '备注',
  };
  return labels[type] || type;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  babyAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addBabyBtn: {
    padding: 8,
  },
  summaryCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle2: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  statUnit: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  quickItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  aiCard: {
    borderWidth: 1,
    borderColor: '#F0D4FF',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: { gap: 2 },
  aiTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  aiSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  recordInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  recordTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recordNote: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    maxWidth: 80,
  },
  recordDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
});
