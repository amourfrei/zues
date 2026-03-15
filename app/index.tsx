import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { useBabyStore } from '../stores/baby.store';
import { Colors } from '../constants/theme';

export default function Index() {
  const { user, initialized } = useAuthStore();
  const { babies, fetchBabies } = useBabyStore();

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    fetchBabies(user.id).then(() => {
      const currentBabies = useBabyStore.getState().babies;
      if (currentBabies.length === 0) {
        router.replace('/modals/baby-setup');
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [initialized, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
  },
});
