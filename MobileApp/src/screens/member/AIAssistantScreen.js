import React, { useState, useRef } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Bot, ChevronLeft, Send, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
};

const renderFormattedText = (text, isUser, colors, isDark) => {
  if (isUser) {
    return (
      <Text style={[styles.messageText, { color: G.white }]}>
        {text}
      </Text>
    );
  }

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let content = line;
    let isBullet = false;

    if (content.trim().startsWith('- ')) {
      isBullet = true;
      content = content.replace(/^\s*-\s+/, '');
    } else if (content.trim().startsWith('* ')) {
      isBullet = true;
      content = content.replace(/^\s*\*\s+/, '');
    } else if (content.trim().startsWith('• ')) {
      isBullet = true;
      content = content.replace(/^\s*•\s+/, '');
    }

    // Tách phần in đậm **bold**
    const parts = content.split(/(\*\*.*?\*\*)/g);
    const elements = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={partIdx} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={partIdx}>{part}</Text>;
    });

    return (
      <View key={lineIdx} style={[styles.textLineContainer, isBullet && styles.bulletContainer]}>
        {isBullet && <Text style={[styles.bulletDot, { color: colors.text }]}>• </Text>}
        <Text style={[styles.messageText, { color: colors.text, flex: 1 }]}>
          {elements}
        </Text>
      </View>
    );
  });
};

export default function AIAssistantScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { selectedBranch } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: 'Xin chào! Mình là Trợ lý ảo Paradise AI. Mình có thể giúp gì cho bạn về chủ đề tập luyện, lịch tập và dinh dưỡng hôm nay?',
      sender: 'ai',
      time: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    setInputText('');
    const userMsgId = `user-${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      text: text,
      sender: 'user',
      time: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await api.post('/assistant/chat', { message: text, chi_nhanh: selectedBranch || '' });
      const reply = response.data?.data?.reply || 'Rất tiếc, mình gặp sự cố khi xử lý câu hỏi này.';
      
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          text: reply,
          sender: 'ai',
          time: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Mobile Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: err?.displayMessage || 'Có lỗi xảy ra khi kết nối với Trợ lý AI.',
          sender: 'ai',
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: G.primaryDark, paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={G.white} size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Bot color={G.white} size={20} strokeWidth={2} />
          <Text style={styles.headerTitle}>Trợ lý ảo Paradise AI</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => {
            const isUser = item.sender === 'user';
            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.aiRow,
                ]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <Bot color={G.primary} size={14} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: G.primary }]
                      : [
                          styles.aiBubble,
                          {
                            backgroundColor: isDark ? colors.surfaceVariant : G.white,
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  {renderFormattedText(item.text, isUser, colors, isDark)}
                </View>
                {isUser && (
                  <View style={[styles.userAvatar, { backgroundColor: G.primary }]}>
                    <User color={G.white} size={14} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <View style={[styles.messageRow, styles.aiRow]}>
              <View style={styles.aiAvatar}>
                <Bot color={G.primary} size={14} />
              </View>
              <View
                style={[
                  styles.messageBubble,
                  styles.aiBubble,
                  {
                    backgroundColor: isDark ? colors.surfaceVariant : G.white,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  },
                ]}
              >
                <ActivityIndicator color={G.primary} size="small" />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Đang nghĩ...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View
          style={[
            styles.inputArea,
            {
              backgroundColor: isDark ? colors.surface : G.white,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.surfaceVariant : G.gray100,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về lịch tập, dinh dưỡng..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: G.primary }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color={G.white} size={16} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: G.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  userRow: {
    selfAlign: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiRow: {
    selfAlign: 'flex-start',
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1d933618',
    borderWidth: 1,
    borderColor: '#1d933630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  textLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
  },
  bulletContainer: {
    paddingLeft: 6,
  },
  bulletDot: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
