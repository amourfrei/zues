import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useBabyStore } from '../../stores/baby.store';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Gender } from '../../constants/types';

const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'A-', 'B-', 'AB-', 'O-'];

export default function BabySetupModal() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthDateStr, setBirthDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [saving, setSaving] = useState(false);

  const { addBaby } = useBabyStore();
  const { user } = useAuthStore();

  const handleDateChange = (text: string) => {
    setBirthDateStr(text);
    try {
      const parts = text.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const d = new Date(text);
        if (!isNaN(d.getTime())) setBirthDate(d);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入宝宝姓名');
      return;
    }
    if (!birthWeight || !birthHeight) {
      Alert.alert('提示', '请输入出生体重和身高');
      return;
    }
    if (!user) {
      Alert.alert('错误', '请先登录');
      return;
    }

    setSaving(true);
    try {
      const baby = await addBaby({
        name: name.trim(),
        gender,
        birth_date: birthDate.toISOString().split('T')[0],
        birth_weight: parseFloat(birthWeight),
        birth_height: parseFloat(birthHeight),
        blood_type: bloodType || undefined,
      }, user.id);

      if (baby) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('错误', err.message);
    } finally {
      setSaving(false);
    }
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = birthWeight && birthHeight;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.handle} />

      {/* Progress */}
      <View style={styles.progress}>
        {[1, 2, 3].map(s => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, step >= s && styles.progressDotActive]}>
              {step > s ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.progressNum, step >= s && styles.progressNumActive]}>{s}</Text>
              )}
            </View>
            {s < 3 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
            <Text style={styles.emoji}>👶</Text>
            <Text style={styles.stepTitle}>宝宝叫什么名字？</Text>
            <Text style={styles.stepSubtitle}>给你的小天使起个名字吧</Text>

            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="宝宝的名字"
              placeholderTextColor={Colors.textTertiary}
              maxLength={20}
              autoFocus
            />

            <Text style={styles.sectionLabel}>性别</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive, { backgroundColor: gender === 'male' ? '#E0F0FF' : Colors.background }]}
                onPress={() => setGender('male')}
              >
                <Text style={styles.genderEmoji}>👦</Text>
                <Text style={[styles.genderLabel, gender === 'male' && { color: '#1A6FCC', fontWeight: FontWeight.bold }]}>男宝宝</Text>
                {gender === 'male' && <Ionicons name="checkmark-circle" size={20} color="#1A6FCC" style={styles.genderCheck} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive, { backgroundColor: gender === 'female' ? '#FFE0F0' : Colors.background }]}
                onPress={() => setGender('female')}
              >
                <Text style={styles.genderEmoji}>👧</Text>
                <Text style={[styles.genderLabel, gender === 'female' && { color: Colors.primary, fontWeight: FontWeight.bold }]}>女宝宝</Text>
                {gender === 'female' && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={styles.genderCheck} />}
              </TouchableOpacity>
            </View>

            <Button
              title="下一步"
              onPress={() => setStep(2)}
              disabled={!canProceedStep1}
              fullWidth
              size="lg"
              style={styles.nextBtn}
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
            <Text style={styles.emoji}>📅</Text>
            <Text style={styles.stepTitle}>出生信息</Text>
            <Text style={styles.stepSubtitle}>帮助我们更好地追踪{name}的成长</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>出生日期</Text>
              <TextInput
                style={styles.input}
                value={birthDateStr}
                onChangeText={handleDateChange}
                placeholder="格式: 2024-01-15"
                placeholderTextColor={Colors.textTertiary}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>出生体重 (克)</Text>
                <TextInput
                  style={styles.input}
                  value={birthWeight}
                  onChangeText={setBirthWeight}
                  placeholder="例: 3200"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>出生身长 (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={birthHeight}
                  onChangeText={setBirthHeight}
                  placeholder="例: 50"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.btnRow}>
              <Button title="上一步" onPress={() => setStep(1)} variant="outline" style={styles.halfBtn} />
              <Button
                title="下一步"
                onPress={() => setStep(3)}
                disabled={!canProceedStep2}
                style={styles.halfBtn}
              />
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.stepTitle}>最后一步</Text>
            <Text style={styles.stepSubtitle}>血型信息（可选，方便医疗记录）</Text>

            <Text style={styles.fieldLabel}>血型</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.slice(0, 4).map(bt => (
                <TouchableOpacity
                  key={bt}
                  style={[styles.bloodChip, bloodType === bt && styles.bloodChipActive]}
                  onPress={() => setBloodType(bloodType === bt ? '' : bt)}
                >
                  <Text style={[styles.bloodText, bloodType === bt && styles.bloodTextActive]}>{bt}型</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>宝宝信息确认</Text>
              <SummaryRow label="姓名" value={name} />
              <SummaryRow label="性别" value={gender === 'male' ? '男宝宝 👦' : '女宝宝 👧'} />
              <SummaryRow label="出生日期" value={birthDateStr} />
              <SummaryRow label="出生体重" value={`${birthWeight}g`} />
              <SummaryRow label="出生身长" value={`${birthHeight}cm`} />
              {bloodType && <SummaryRow label="血型" value={`${bloodType}型`} />}
            </View>

            <View style={styles.btnRow}>
              <Button title="上一步" onPress={() => setStep(2)} variant="outline" style={styles.halfBtn} />
              <Button
                title="开始记录"
                onPress={handleSave}
                loading={saving}
                style={styles.halfBtn}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  progressNumActive: { color: '#fff' },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  progressLineActive: { backgroundColor: Colors.primary },
  content: { padding: Spacing.md, paddingBottom: 60 },
  stepContent: { gap: 20 },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  nameInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genderBtn: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
    position: 'relative',
  },
  genderBtnActive: { borderColor: Colors.primary },
  genderEmoji: { fontSize: 40 },
  genderLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  genderCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  nextBtn: { marginTop: 8 },
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
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  halfBtn: { flex: 1 },
  bloodGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  bloodChip: {
    flex: 1,
    minWidth: 64,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  bloodChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  bloodText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  bloodTextActive: { color: Colors.primaryDark },
  summaryCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
});
