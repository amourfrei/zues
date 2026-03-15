import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { MeasurementData } from '../../constants/types';

const { width } = Dimensions.get('window');

// China's National Immunization Program vaccines
const VACCINE_SCHEDULE = [
  { name: '乙肝疫苗第1剂', nameEn: 'Hepatitis B (1st)', ageMonths: 0 },
  { name: '卡介苗', nameEn: 'BCG', ageMonths: 0 },
  { name: '乙肝疫苗第2剂', nameEn: 'Hepatitis B (2nd)', ageMonths: 1 },
  { name: '脊灰灭活疫苗第1剂', nameEn: 'IPV (1st)', ageMonths: 2 },
  { name: '百白破第1剂', nameEn: 'DTaP (1st)', ageMonths: 3 },
  { name: '脊灰减毒疫苗第1剂', nameEn: 'OPV (1st)', ageMonths: 3 },
  { name: '百白破第2剂', nameEn: 'DTaP (2nd)', ageMonths: 4 },
  { name: '脊灰减毒疫苗第2剂', nameEn: 'OPV (2nd)', ageMonths: 4 },
  { name: '百白破第3剂', nameEn: 'DTaP (3rd)', ageMonths: 5 },
  { name: '乙肝疫苗第3剂', nameEn: 'Hepatitis B (3rd)', ageMonths: 6 },
  { name: 'A群流脑多糖疫苗第1剂', nameEn: 'MenA (1st)', ageMonths: 6 },
  { name: '麻腮风疫苗第1剂', nameEn: 'MMR (1st)', ageMonths: 8 },
  { name: '乙脑减毒疫苗第1剂', nameEn: 'JEV (1st)', ageMonths: 8 },
  { name: 'A群流脑多糖疫苗第2剂', nameEn: 'MenA (2nd)', ageMonths: 9 },
  { name: '甲肝减毒疫苗', nameEn: 'Hep A', ageMonths: 18 },
  { name: '百白破第4剂', nameEn: 'DTaP (4th)', ageMonths: 18 },
  { name: '麻腮风疫苗第2剂', nameEn: 'MMR (2nd)', ageMonths: 18 },
  { name: 'A+C群流脑多糖疫苗第1剂', nameEn: 'MenAC (1st)', ageMonths: 36 },
  { name: '乙脑减毒疫苗第2剂', nameEn: 'JEV (2nd)', ageMonths: 24 },
];

type Tab = 'vaccines' | 'growth' | 'measurements';

export default function HealthScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('vaccines');
  const { activeBaby } = useBabyStore();
  const { records } = useRecordsStore();

  const measurementRecords = records.filter(r =>
    ['weight', 'height', 'temperature', 'jaundice'].includes(r.type)
  );

  const getVaccineStatus = (ageMonths: number) => {
    if (!activeBaby) return 'scheduled';
    const babyAgeMonths = Math.floor(
      differenceInDays(new Date(), new Date(activeBaby.birth_date)) / 30
    );
    if (babyAgeMonths > ageMonths) return 'overdue';
    if (babyAgeMonths === ageMonths) return 'scheduled';
    return 'scheduled';
  };

  const getScheduledDate = (ageMonths: number): string => {
    if (!activeBaby) return '-';
    const birthDate = new Date(activeBaby.birth_date);
    const scheduled = new Date(birthDate);
    scheduled.setMonth(scheduled.getMonth() + ageMonths);
    return format(scheduled, 'yyyy年MM月dd日');
  };

  const getDaysUntil = (ageMonths: number): number => {
    if (!activeBaby) return 0;
    const birthDate = new Date(activeBaby.birth_date);
    const scheduled = new Date(birthDate);
    scheduled.setMonth(scheduled.getMonth() + ageMonths);
    return differenceInDays(scheduled, new Date());
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>健康档案</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['vaccines', 'growth', 'measurements'] as Tab[]).map(tab => {
          const labels = { vaccines: '疫苗计划', growth: '生长曲线', measurements: '健康数据' };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'vaccines' && (
          <Animated.View entering={FadeInDown}>
            {VACCINE_SCHEDULE.map((vaccine, i) => {
              const daysUntil = getDaysUntil(vaccine.ageMonths);
              const status = daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'due_today' : 'upcoming';
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 20)}>
                  <VaccineCard
                    vaccine={vaccine}
                    scheduledDate={getScheduledDate(vaccine.ageMonths)}
                    daysUntil={daysUntil}
                    status={status}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {activeTab === 'growth' && (
          <Animated.View entering={FadeInDown}>
            <GrowthChart records={measurementRecords} />
          </Animated.View>
        )}

        {activeTab === 'measurements' && (
          <Animated.View entering={FadeInDown}>
            <MeasurementsView records={measurementRecords} />
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function VaccineCard({ vaccine, scheduledDate, daysUntil, status }: any) {
  const statusConfig = {
    overdue: { color: Colors.error, bg: '#FFF0F0', icon: 'alert-circle', label: `逾期${Math.abs(daysUntil)}天` },
    due_today: { color: Colors.warning, bg: '#FFFAEE', icon: 'time', label: '今天接种' },
    upcoming: { color: Colors.success, bg: '#EFFAF6', icon: 'checkmark-circle', label: daysUntil <= 30 ? `${daysUntil}天后` : scheduledDate },
  };
  const cfg = statusConfig[status as keyof typeof statusConfig];

  return (
    <Card style={styles.vaccineCard} variant="elevated">
      <View style={styles.vaccineRow}>
        <View style={[styles.vaccineIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.vaccineInfo}>
          <Text style={styles.vaccineName}>{vaccine.name}</Text>
          <Text style={styles.vaccineDate}>{scheduledDate}</Text>
        </View>
        <View style={[styles.vaccineStatus, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.vaccineStatusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </Card>
  );
}

function GrowthChart({ records }: { records: any[] }) {
  const weights = records.filter(r => r.type === 'weight').slice(0, 8).reverse();
  const heights = records.filter(r => r.type === 'height').slice(0, 8).reverse();

  return (
    <View>
      <Card variant="elevated" style={styles.chartCard}>
        <Text style={styles.chartTitle}>体重记录</Text>
        {weights.length > 0 ? (
          <View>
            {weights.map((r, i) => {
              const data = r.data as MeasurementData;
              const maxWeight = Math.max(...weights.map((w: any) => w.data.value));
              const pct = maxWeight > 0 ? (data.value / maxWeight) * 100 : 50;
              return (
                <View key={r.id} style={styles.barRow}>
                  <Text style={styles.barDate}>{format(new Date(r.started_at), 'MM/dd')}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.feeding }]} />
                  </View>
                  <Text style={styles.barValue}>{data.value}kg</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noData}>暂无体重记录</Text>
        )}
      </Card>

      <Card variant="elevated" style={styles.chartCard}>
        <Text style={styles.chartTitle}>身高记录</Text>
        {heights.length > 0 ? (
          <View>
            {heights.map((r, i) => {
              const data = r.data as MeasurementData;
              const maxHeight = Math.max(...heights.map((h: any) => h.data.value));
              const pct = maxHeight > 0 ? (data.value / maxHeight) * 100 : 50;
              return (
                <View key={r.id} style={styles.barRow}>
                  <Text style={styles.barDate}>{format(new Date(r.started_at), 'MM/dd')}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.sleep }]} />
                  </View>
                  <Text style={styles.barValue}>{data.value}cm</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noData}>暂无身高记录</Text>
        )}
      </Card>
    </View>
  );
}

function MeasurementsView({ records }: { records: any[] }) {
  const types = [
    { key: 'weight', label: '体重', unit: 'kg', color: Colors.feeding, icon: '⚖️' },
    { key: 'height', label: '身高', unit: 'cm', color: Colors.sleep, icon: '📏' },
    { key: 'temperature', label: '体温', unit: '°C', color: Colors.error, icon: '🌡️' },
    { key: 'jaundice', label: '黄疸', unit: 'mg/dL', color: Colors.warning, icon: '☀️' },
  ];

  return (
    <View>
      {types.map(type => {
        const typeRecords = records.filter(r => r.type === type.key).slice(0, 5);
        const latest = typeRecords[0];
        const latestData = latest?.data as MeasurementData;

        return (
          <Card key={type.key} variant="elevated" style={styles.measureCard}>
            <View style={styles.measureHeader}>
              <Text style={styles.measureEmoji}>{type.icon}</Text>
              <View style={styles.measureTitleBox}>
                <Text style={styles.measureTitle}>{type.label}</Text>
                {latest && (
                  <Text style={[styles.measureValue, { color: type.color }]}>
                    {latestData.value} {type.unit}
                  </Text>
                )}
              </View>
              {latest && (
                <Text style={styles.measureDate}>
                  {format(new Date(latest.started_at), 'MM/dd')}
                </Text>
              )}
            </View>

            {typeRecords.length > 0 && (
              <View style={styles.measureList}>
                {typeRecords.map((r, i) => {
                  const d = r.data as MeasurementData;
                  return (
                    <View key={r.id} style={styles.measureRow}>
                      <Text style={styles.measureRowDate}>
                        {format(new Date(r.started_at), 'MM-dd HH:mm')}
                      </Text>
                      <Text style={[styles.measureRowValue, { color: type.color }]}>
                        {d.value} {type.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {typeRecords.length === 0 && (
              <Text style={styles.noData}>暂无记录，在记录页面添加{type.label}数据</Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: 12 },
  vaccineCard: { padding: 0, marginBottom: 8 },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  vaccineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineInfo: { flex: 1 },
  vaccineName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  vaccineDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vaccineStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  vaccineStatusText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  chartCard: { marginBottom: 16 },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  barDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 36,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    width: 48,
    textAlign: 'right',
  },
  noData: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    padding: 20,
  },
  measureCard: { marginBottom: 12 },
  measureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  measureEmoji: { fontSize: 28 },
  measureTitleBox: { flex: 1 },
  measureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  measureValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  measureDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  measureList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 8,
  },
  measureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measureRowDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  measureRowValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
