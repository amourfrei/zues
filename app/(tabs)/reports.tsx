import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, subMonths } from 'date-fns';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { generateReport } from '../../lib/ai';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Report } from '../../constants/types';

type PeriodType = 'weekly' | 'monthly';

export default function ReportsScreen() {
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const { activeBaby } = useBabyStore();
  const { records } = useRecordsStore();

  const handleGenerate = async () => {
    if (!activeBaby) {
      Alert.alert('提示', '请先添加宝宝信息');
      return;
    }

    if (records.length < 5) {
      Alert.alert('数据不足', '需要至少5条记录才能生成报告，请先多记录一些数据');
      return;
    }

    setGenerating(true);
    try {
      const now = new Date();
      const start = periodType === 'weekly' ? subDays(now, 7) : subMonths(now, 1);
      const periodRecords = records.filter(r => new Date(r.started_at) >= start);

      const result = await generateReport(activeBaby, periodRecords, periodType);

      const newReport: Report = {
        id: `report_${Date.now()}`,
        baby_id: activeBaby.id,
        period_start: start.toISOString(),
        period_end: now.toISOString(),
        type: periodType,
        summary: result.summary,
        insights: result.insights,
        suggestions: result.suggestions,
        generated_at: now.toISOString(),
      };

      setReports(prev => [newReport, ...prev]);
    } catch {
      Alert.alert('错误', '生成报告失败，请检查网络连接后重试');
    } finally {
      setGenerating(false);
    }
  };

  // Stats from records
  const now = new Date();
  const weekStart = subDays(now, 7);
  const weekRecords = records.filter(r => new Date(r.started_at) >= weekStart);
  const feedingCount = weekRecords.filter(r => r.type === 'feeding').length;
  const diaperCount = weekRecords.filter(r => r.type === 'diaper').length;
  const sleepRecords = weekRecords.filter(r => r.type === 'sleep' && r.ended_at);
  const totalSleepHours = sleepRecords.reduce((sum, r) => {
    if (!r.ended_at) return sum;
    return sum + (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 3600000;
  }, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>成长报告</Text>
        </View>

        {/* Period Selector */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodBtn, periodType === 'weekly' && styles.periodBtnActive]}
            onPress={() => setPeriodType('weekly')}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={periodType === 'weekly' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.periodLabel, periodType === 'weekly' && styles.periodLabelActive]}>
              周报
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, periodType === 'monthly' && styles.periodBtnActive]}
            onPress={() => setPeriodType('monthly')}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={periodType === 'monthly' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.periodLabel, periodType === 'monthly' && styles.periodLabelActive]}>
              月报
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* This Week Stats */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>本周数据概览</Text>
          <View style={styles.statsGrid}>
            <StatBox
              icon="nutrition"
              label="喂养"
              value={`${feedingCount}`}
              unit="次"
              sublabel={`日均${(feedingCount / 7).toFixed(1)}次`}
              color={Colors.feeding}
              bg="#FFF0F5"
            />
            <StatBox
              icon="moon"
              label="睡眠"
              value={totalSleepHours.toFixed(0)}
              unit="h"
              sublabel={`日均${(totalSleepHours / 7).toFixed(1)}h`}
              color={Colors.sleep}
              bg="#F3F0FF"
            />
            <StatBox
              icon="water"
              label="换尿布"
              value={`${diaperCount}`}
              unit="次"
              sublabel={`日均${(diaperCount / 7).toFixed(1)}次`}
              color={Colors.diaper}
              bg="#EFFAF6"
            />
            <StatBox
              icon="document-text"
              label="总记录"
              value={`${weekRecords.length}`}
              unit="条"
              sublabel="本周"
              color={Colors.accent}
              bg="#EFFAF6"
            />
          </View>
        </Animated.View>

        {/* Generate Button */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <Button
            title={generating ? '分析数据中...' : `生成${periodType === 'weekly' ? '周' : '月'}报告`}
            onPress={handleGenerate}
            loading={generating}
            fullWidth
            size="lg"
            icon={<Ionicons name="sparkles" size={18} color="#fff" />}
          />
        </Animated.View>

        {/* Reports List */}
        {reports.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>历史报告</Text>
            {reports.map((report, i) => (
              <Animated.View key={report.id} entering={FadeInDown.delay(i * 50)}>
                <ReportCard report={report} />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {reports.length === 0 && !generating && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>还没有报告</Text>
            <Text style={styles.emptySubtitle}>
              持续记录宝宝数据，AI将帮助你分析规律并给出改善建议
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, label, value, unit, sublabel, color, bg }: any) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={[styles.statUnit, { color }]}>{unit}</Text>
      </View>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </View>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="elevated" style={styles.reportCard}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <View style={styles.reportHeader}>
          <View style={styles.reportTitleRow}>
            <View style={[styles.reportBadge, { backgroundColor: report.type === 'weekly' ? '#E3F0FF' : '#FFE3F0' }]}>
              <Text style={[styles.reportBadgeText, { color: report.type === 'weekly' ? '#1A6FCC' : Colors.primary }]}>
                {report.type === 'weekly' ? '周报' : '月报'}
              </Text>
            </View>
            <Text style={styles.reportPeriod}>
              {format(new Date(report.period_start), 'MM/dd')} - {format(new Date(report.period_end), 'MM/dd')}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textSecondary}
          />
        </View>

        <Text style={styles.reportSummary} numberOfLines={expanded ? undefined : 2}>
          {report.summary}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.reportDetails}>
          <View style={styles.reportSection}>
            <View style={styles.reportSectionHeader}>
              <Ionicons name="bulb" size={16} color={Colors.warning} />
              <Text style={styles.reportSectionTitle}>数据洞察</Text>
            </View>
            {report.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={styles.dot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reportSection}>
            <View style={styles.reportSectionHeader}>
              <Ionicons name="star" size={16} color={Colors.primary} />
              <Text style={styles.reportSectionTitle}>改善建议</Text>
            </View>
            {report.suggestions.map((sug, i) => (
              <View key={i} style={[styles.insightRow, styles.suggestionRow]}>
                <Text style={styles.suggestionNum}>{i + 1}</Text>
                <Text style={styles.insightText}>{sug}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.generatedAt}>
            生成于 {format(new Date(report.generated_at), 'yyyy年MM月dd日 HH:mm')}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: 20 },
  header: { paddingVertical: 8 },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  periodBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  periodLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  statBox: {
    width: '47%',
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
  },
  statUnit: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  statSublabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  reportCard: {
    marginBottom: 12,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  reportBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reportPeriod: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  reportSummary: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  reportDetails: {
    marginTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  reportSection: { gap: 8 },
  reportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reportSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionRow: { alignItems: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
    marginTop: 8,
  },
  insightText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  suggestionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
  },
  generatedAt: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
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
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
