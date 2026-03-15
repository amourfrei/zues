import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { Baby } from '../../constants/types';

interface Props {
  baby: Baby;
  size?: number;
}

export function BabyAvatar({ baby, size = 60 }: Props) {
  const emoji = baby.gender === 'male' ? '👦' : '👧';
  const bg = baby.gender === 'male' ? '#E0F0FF' : '#FFE0F0';

  if (baby.avatar_url) {
    return (
      <Image
        source={{ uri: baby.avatar_url }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
});
