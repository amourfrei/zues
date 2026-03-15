import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordType } from '../../constants/types';
import { Colors, BorderRadius } from '../../constants/theme';

const RECORD_CONFIG: Record<RecordType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }> = {
  feeding: { icon: 'nutrition', color: Colors.feeding, bg: '#FFF0F5', label: '喂奶' },
  sleep: { icon: 'moon', color: Colors.sleep, bg: '#F3F0FF', label: '睡眠' },
  diaper: { icon: 'water', color: Colors.diaper, bg: '#EFFAF6', label: '尿布' },
  bath: { icon: 'sparkles', color: Colors.bath, bg: '#EFF9FF', label: '洗澡' },
  weight: { icon: 'scale', color: Colors.health, bg: '#FFF4EE', label: '体重' },
  height: { icon: 'resize', color: Colors.health, bg: '#FFF4EE', label: '身高' },
  temperature: { icon: 'thermometer', color: Colors.error, bg: '#FFF0F0', label: '体温' },
  jaundice: { icon: 'sunny', color: Colors.warning, bg: '#FFFAEE', label: '黄疸' },
  medicine: { icon: 'medical', color: Colors.accent, bg: '#EFFAF6', label: '用药' },
  note: { icon: 'document-text', color: Colors.textSecondary, bg: '#F9FAFB', label: '备注' },
};

interface Props {
  type: RecordType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RecordTypeIcon({ type, size = 'md', showLabel = false }: Props) {
  const config = RECORD_CONFIG[type];
  const iconSizes = { sm: 16, md: 22, lg: 28 };
  const containerSizes = { sm: 32, md: 44, lg: 56 };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: config.bg,
            width: containerSizes[size],
            height: containerSizes[size],
            borderRadius: containerSizes[size] / 2,
          },
        ]}
      >
        <Ionicons name={config.icon} size={iconSizes[size]} color={config.color} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      )}
    </View>
  );
}

export function getRecordConfig(type: RecordType) {
  return RECORD_CONFIG[type];
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
