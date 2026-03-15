import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useBabyStore } from '../../stores/baby.store';
import { useRecordsStore } from '../../stores/records.store';
import { chatWithAI, generateParentingPlan } from '../../lib/ai';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { ChatMessage } from '../../constants/types';

const SUGGESTIONS = [
  '宝宝多久喂一次奶合适？',
  '怎样帮助宝宝建立睡眠规律？',
  '黄疸值多少需要就医？',
  '如何促进宝宝的认知发育？',
  '宝宝不爱喝奶怎么办？',
  '什么时候开始加辅食？',
];

let messageIdCounter = 0;

export default function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是萌宝助手 🍼\n\n我可以帮你解答育儿问题、分析宝宝的喂养睡眠数据，以及生成个性化育儿计划。\n\n请问有什么可以帮到你的？',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { activeBaby } = useBabyStore();
  const { getTodayRecords } = useRecordsStore();

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${++messageIdCounter}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const todayRecords = getTodayRecords();
      const response = await chatWithAI(
        newMessages.filter(m => m.id !== 'welcome').map(m => ({
          role: m.role,
          content: m.content,
        })),
        {
          baby: activeBaby || undefined,
          recentRecords: todayRecords,
        }
      );

      const assistantMsg: ChatMessage = {
        id: `msg_${++messageIdCounter}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      Alert.alert('错误', '无法连接AI服务，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!activeBaby) {
      Alert.alert('提示', '请先添加宝宝信息');
      return;
    }
    setPlanLoading(true);
    try {
      const plan = await generateParentingPlan(activeBaby);
      const planMsg: ChatMessage = {
        id: `msg_${++messageIdCounter}`,
        role: 'assistant',
        content: `📋 **${activeBaby.name}的个性化育儿计划**\n\n${plan}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, planMsg]);
    } catch {
      Alert.alert('错误', '生成育儿计划失败，请稍后重试');
    } finally {
      setPlanLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert('清除对话', '确定要清除所有对话记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除', style: 'destructive',
        onPress: () => setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '对话已清除。有什么可以帮到你的？',
          timestamp: new Date().toISOString(),
        }]),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarEmoji}>✨</Text>
            </View>
            <View>
              <Text style={styles.title}>AI育儿助手</Text>
              <Text style={styles.subtitle}>专业·温暖·随时在线</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={generatePlan}>
              {planLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={clearChat}>
              <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Suggestion chips (only when few messages) */}
          {messages.length <= 1 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>常见问题</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} />
          ))}

          {loading && (
            <View style={styles.typingIndicator}>
              <View style={styles.aiAvatarSmall}>
                <Text>✨</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>思考中...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          AI建议仅供参考，健康问题请咨询专业儿科医生
        </Text>

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="问我任何育儿问题..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? FadeInRight.delay(50).springify() : FadeInLeft.delay(50).springify()}
      style={[styles.messageBubbleRow, isUser ? styles.userRow : styles.assistantRow]}
    >
      {!isUser && (
        <View style={styles.aiAvatarSmall}>
          <Text style={styles.aiAvatarSmallEmoji}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  aiAvatarEmoji: { fontSize: 22 },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { flex: 1 },
  messagesContent: {
    padding: Spacing.md,
    gap: 12,
    paddingBottom: 20,
  },
  suggestions: { marginBottom: 8 },
  suggestionsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  aiAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarSmallEmoji: { fontSize: 16 },
  bubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.xl,
    padding: 14,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: Colors.textInverse,
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
});
