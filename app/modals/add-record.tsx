import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { RecordTypeIcon } from '../../components/ui/RecordTypeIcon';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { RecordType, FeedingData, SleepData, DiaperData } from '../../constants/types';

const RECORD_TYPES: Array<{ type: RecordType; label: string; emoji: string }> = [
  { type: 'feeding', label: '喂奶/喂食', emoji: '🍼' },
  { type: 'sleep', label: '睡眠', emoji: '😴' },
  { type: 'diaper', label: '换尿布', emoji: '👶' },
  { type: 'bath', label: '洗澡', emoji: '🛁' },
  { type: 'temperature', label: '体温', emoji: '🌡️' },
  { type: 'weight', label: '体重', emoji: '⚖️' },
  { type: 'height', label: '身高', emoji: '📏' },
  { type: 'jaundice', label: '黄疸', emoji: '☀️' },
  { type: 'medicine', label: '用药', emoji: '💊' },
  { type: 'note', label: '备注', emoji: '📝' },
];

export default function AddRecordModal() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [selectedType, setSelectedType] = useState<RecordType>((params.type as RecordType) || 'feeding');
  const [step, setStep] = useState(params.type ? 'details' : 'type');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  // Time
  const [startTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Feeding fields
  const [feedingMethod, setFeedingMethod] = useState<FeedingData['method']>('breast_left');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingDuration, setFeedingDuration] = useState('');

  // Diaper fields
  const [diaperType, setDiaperType] = useState<DiaperData['type']>('wet');

  // Sleep
  const [sleepOngoing, setSleepOngoing] = useState(false);

  // Measurement
  const [measureValue, setMeasureValue] = useState('');

  const { activeBaby } = useBabyStore();
  const { addRecord } = useRecordsStore();

  const handleSave = async () => {
    if (!activeBaby) {
      Alert.alert('提示', '请先添加宝宝信息');
      return;
    }

    setSaving(true);
    try {
      let data: any = {};

      switch (selectedType) {
        case 'feeding':
          data = {
            method: feedingMethod,
            amount_ml: feedingAmount ? parseFloat(feedingAmount) : undefined,
            duration_minutes: feedingDuration ? parseInt(feedingDuration) : undefined,
          };
          break;
        case 'sleep':
          data = { location: 'crib' };
          break;
        case 'diaper':
          data = { type: diaperType };
          break;
        case 'weight':
          if (!measureValue) { Alert.alert('提示', '请输入体重'); setSaving(false); return; }
          data = { value: parseFloat(measureValue), unit: 'kg', type: 'weight' };
          break;
        case 'height':
          if (!measureValue) { Alert.alert('提示', '请输入身高'); setSaving(false); return; }
          data = { value: parseFloat(measureValue), unit: 'cm', type: 'height' };
          break;
        case 'temperature':
          if (!measureValue) { Alert.alert('提示', '请输入体温'); setSaving(false); return; }
          data = { value: parseFloat(measureValue), unit: '°C', type: 'temperature' };
          break;
        case 'jaundice':
          if (!measureValue) { Alert.alert('提示', '请输入黄疸值'); setSaving(false); return; }
          data = { value: parseFloat(measureValue), unit: 'mg/dL', type: 'jaundice' };
          break;
        case 'bath':
          data = { content: '洗澡' };
          break;
        case 'medicine':
          data = { content: note || '用药' };
          break;
        case 'note':
          if (!note) { Alert.alert('提示', '请输入备注内容'); setSaving(false); return; }
          data = { content: note };
          break;
      }

      await addRecord({
        baby_id: activeBaby.id,
        type: selectedType,
        started_at: startTime.toISOString(),
        ended_at: selectedType === 'sleep' && !sleepOngoing && endTime ? endTime.toISOString() : undefined,
        data,
        note: selectedType !== 'note' ? note : undefined,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('错误', '保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'type') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>选择记录类型</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.typeGrid}>
          {RECORD_TYPES.map((item, i) => (
            <Animated.View key={item.type} entering={FadeInDown.delay(i * 30)} style={styles.typeItemWrapper}>
              <TouchableOpacity
                style={styles.typeItem}
                onPress={() => {
                  setSelectedType(item.type);
                  setStep('details');
                }}
              >
                <View style={styles.typeItemInner}>
                  <Text style={styles.typeEmoji}>{item.emoji}</Text>
                  <Text style={styles.typeLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => params.type ? router.back() : setStep('type')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <RecordTypeIcon type={selectedType} size="sm" />
          <Text style={styles.title}>{RECORD_TYPES.find(t => t.type === selectedType)?.label}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {/* Time display */}
        <Card style={styles.timeCard} variant="outlined">
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.timeText}>开始时间: {format(startTime, 'HH:mm')}</Text>
          </View>
        </Card>

        {/* Type-specific fields */}
        {selectedType === 'feeding' && (
          <FeedingForm
            method={feedingMethod}
            setMethod={setFeedingMethod}
            amount={feedingAmount}
            setAmount={setFeedingAmount}
            duration={feedingDuration}
            setDuration={setFeedingDuration}
          />
        )}

        {selectedType === 'sleep' && (
          <SleepForm
            ongoing={sleepOngoing}
            setOngoing={setSleepOngoing}
          />
        )}

        {selectedType === 'diaper' && (
          <DiaperForm type={diaperType} setType={setDiaperType} />
        )}

        {['weight', 'height', 'temperature', 'jaundice'].includes(selectedType) && (
          <MeasurementForm
            type={selectedType as any}
            value={measureValue}
            setValue={setMeasureValue}
          />
        )}

        {/* Note field */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>备注（可选）</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="添加备注..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={200}
          />
        </View>

        <Button
          title="保存记录"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={styles.saveBtn}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedingForm({ method, setMethod, amount, setAmount, duration, setDuration }: any) {
  const methods: Array<{ value: FeedingData['method']; label: string; icon: string }> = [
    { value: 'breast_left', label: '左侧母乳', icon: '👈' },
    { value: 'breast_right', label: '右侧母乳', icon: '👉' },
    { value: 'breast_both', label: '双侧母乳', icon: '👐' },
    { value: 'bottle_formula', label: '配方奶', icon: '🍼' },
    { value: 'bottle_breast_milk', label: '母乳瓶喂', icon: '🤱' },
    { value: 'solid_food', label: '辅食', icon: '🥣' },
  ];

  const isBreast = method.startsWith('breast');

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>喂食方式</Text>
      <View style={styles.methodGrid}>
        {methods.map(m => (
          <TouchableOpacity
            key={m.value}
            style={[styles.methodChip, method === m.value && styles.methodChipActive]}
            onPress={() => setMethod(m.value)}
          >
            <Text style={styles.methodEmoji}>{m.icon}</Text>
            <Text style={[styles.methodLabel, method === m.value && styles.methodLabelActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isBreast ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>时长（分钟）</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="例如: 15"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>奶量（毫升）</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="例如: 120"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      )}
    </View>
  );
}

function SleepForm({ ongoing, setOngoing }: any) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.toggleRow, ongoing && styles.toggleRowActive]}
        onPress={() => setOngoing(!ongoing)}
      >
        <Text style={styles.toggleLabel}>宝宝正在睡觉中</Text>
        <View style={[styles.toggle, ongoing && styles.toggleOn]}>
          <View style={[styles.toggleThumb, ongoing && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>
      {ongoing && (
        <Text style={styles.hint}>宝宝醒来后再次打开App记录结束时间</Text>
      )}
    </View>
  );
}

function DiaperForm({ type, setType }: any) {
  const types: Array<{ value: DiaperData['type']; label: string; emoji: string }> = [
    { value: 'wet', label: '湿尿布', emoji: '💧' },
    { value: 'dirty', label: '便便', emoji: '💩' },
    { value: 'both', label: '混合', emoji: '🔄' },
    { value: 'dry', label: '干净', emoji: '✨' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>类型</Text>
      <View style={styles.methodGrid}>
        {types.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.methodChip, type === t.value && styles.methodChipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={styles.methodEmoji}>{t.emoji}</Text>
            <Text style={[styles.methodLabel, type === t.value && styles.methodLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MeasurementForm({ type, value, setValue }: { type: string; value: string; setValue: (v: string) => void }) {
  const config: Record<string, { label: string; placeholder: string; unit: string; hint?: string }> = {
    weight: { label: '体重', placeholder: '例如: 5.2', unit: 'kg', hint: '精确到0.1kg' },
    height: { label: '身高', placeholder: '例如: 60.5', unit: 'cm', hint: '精确到0.5cm' },
    temperature: { label: '体温', placeholder: '例如: 36.8', unit: '°C', hint: '正常体温36-37.3°C' },
    jaundice: { label: '黄疸值', placeholder: '例如: 8.5', unit: 'mg/dL', hint: '新生儿>12.9需就医' },
  };
  const cfg = config[type] || { label: type, placeholder: '请输入数值', unit: '' };

  return (
    <View style={styles.section}>
      <View style={styles.measureInputRow}>
        <TextInput
          style={[styles.input, styles.measureInput]}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={cfg.placeholder}
          placeholderTextColor={Colors.textTertiary}
        />
        <View style={styles.unitBadge}>
          <Text style={styles.unitText}>{cfg.unit}</Text>
        </View>
      </View>
      {cfg.hint && <Text style={styles.hint}>{cfg.hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  typeGrid: {
    padding: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeItemWrapper: { width: '30%' },
  typeItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  typeItemInner: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  typeEmoji: { fontSize: 32 },
  typeLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  formContent: { padding: Spacing.md, gap: 16 },
  timeCard: { padding: 12 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  section: { gap: 12 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  methodEmoji: { fontSize: 16 },
  methodLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  methodLabelActive: { color: Colors.primaryDark },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleRowActive: {
    backgroundColor: '#FFF0F5',
    borderColor: Colors.primaryLight,
  },
  toggleLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  measureInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  measureInput: { flex: 1 },
  unitBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  unitText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
  },
  saveBtn: { marginTop: 8 },
});
