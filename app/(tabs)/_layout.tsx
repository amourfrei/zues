import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/theme';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={styles.iconWrapper}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as any)}
        size={24}
        color={focused ? Colors.primary : Colors.tabInactive}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} label="首页" />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '记录',
          tabBarIcon: ({ focused }) => <TabIcon name="add-circle" focused={focused} label="记录" />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: '健康',
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} label="健康" />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI助手',
          tabBarIcon: ({ focused }) => <TabIcon name="sparkles" focused={focused} label="AI助手" />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: '报告',
          tabBarIcon: ({ focused }) => <TabIcon name="bar-chart" focused={focused} label="报告" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
