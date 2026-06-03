import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
  Keyboard, Animated
} from 'react-native';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function AIAssistantBubble() {
  const { colors, isDark } = useTheme();
  const { user, role, token, selectedBranch } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const cardStyle = useMemo(() => {
    if (keyboardVisible) {
      if (Platform.OS === 'ios') {
        const availableHeight = SCREEN_HEIGHT - keyboardHeight - 110;
        return {
          bottom: keyboardHeight + 10,
          height: Math.min(availableHeight, 380),
        };
      } else {
        const availableHeight = SCREEN_HEIGHT - keyboardHeight - 110;
        return {
          bottom: 10,
          height: Math.min(availableHeight, 380),
        };
      }
    } else {
      return {
        bottom: 90,
        height: SCREEN_HEIGHT * 0.58,
      };
    }
  }, [keyboardVisible, keyboardHeight]);

  // Animations refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef();

  // Dynamic config based on user role
  const chatConfig = useMemo(() => {
    if (!token) return null;
    
    switch (role) {
      case 'pt':
        return {
          welcome: `Xin chào HLV ${user?.name || ''}! Mình là Trợ lý Nghiệp vụ Paradise AI. Mình có thể hỗ trợ gì cho bạn về giáo án tập luyện, lịch dạy học viên và quy chế phòng gym hôm nay?`,
          placeholder: 'Hỏi về giáo án, lịch dạy, quy chế...',
          headerTitle: 'Trợ lý Nghiệp vụ AI',
          headerSubtitle: 'Dành riêng cho HLV',
        };
      case 'admin':
      case 'le_tan':
        return {
          welcome: `Xin chào ${role === 'le_tan' ? 'Lễ tân' : 'Quản trị viên'} ${user?.name || ''}! Mình là Trợ lý Vận hành Paradise AI. Mình có thể giúp gì về nghiệp vụ duyệt gói tập, check-in hoặc thống kê doanh thu phòng gym hôm nay?`,
          placeholder: 'Hỏi về nghiệp vụ, check-in, doanh thu...',
          headerTitle: 'Trợ lý Vận hành AI',
          headerSubtitle: 'Dành cho Quản lý & Lễ tân',
        };
      case 'hoi_vien':
      default:
        return {
          welcome: `Xin chào ${user?.name || 'bạn'}! Mình là Trợ lý ảo Paradise AI. Mình có thể giúp gì cho bạn về chủ đề tập luyện, lịch tập và dinh dưỡng hôm nay?`,
          placeholder: 'Hỏi về lịch tập, thực đơn dinh dưỡng...',
          headerTitle: 'Trợ lý ảo Paradise AI',
          headerSubtitle: 'Paradise Gym Health Coach',
        };
    }
  }, [role, user, token]);

  // Initial welcome message setup when chat config changes
  useEffect(() => {
    if (chatConfig) {
      setMessages([
        {
          id: 'welcome',
          text: chatConfig.welcome,
          sender: 'ai',
          time: new Date(),
        },
      ]);
    }
  }, [chatConfig]);

  // If user is not logged in, do not render bubble
  if (!token) return null;

  const handleOpen = () => {
    // Hide bubble, show card and animate in
    Animated.timing(bubbleScale, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowBubble(false);
      setShowCard(true);
      setIsOpen(true);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleClose = () => {
    Keyboard.dismiss();
    
    // Animate card out, show bubble and animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCard(false);
      setIsOpen(false);
      setShowBubble(true);
      
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    });
  };

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
      console.error('Mobile Overlay Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: err.response?.data?.message || 'Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra lại kết nối mạng.',
          sender: 'ai',
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* ── BONG BÓNG CHAT NỔI (LAUNCHER) ── */}
      {showBubble && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            { transform: [{ scale: bubbleScale }] }
          ]}
        >
          <TouchableOpacity
            style={[styles.bubbleButton, { backgroundColor: G.primary }]}
            onPress={handleOpen}
            activeOpacity={0.85}
          >
            <MessageSquare color={G.white} size={24} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── KHUNG CHAT BOX OVERLAY ── */}
      {showCard && chatConfig && (
        <Animated.View
          style={[
            styles.chatCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: isDark ? colors.surface : G.white,
              borderColor: colors.border,
            },
            cardStyle
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: G.primaryDark }]}>
            <View style={styles.headerLeft}>
              <Bot color={G.white} size={18} strokeWidth={2} />
              <View>
                <Text style={styles.headerTitle}>{chatConfig.headerTitle}</Text>
                <Text style={styles.headerSubtitle}>{chatConfig.headerSubtitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X color={G.white} size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {/* Scrollable Messages */}
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
                        <Bot color={G.primary} size={12} />
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
                                backgroundColor: isDark ? colors.surfaceVariant : G.gray100,
                                borderColor: colors.border,
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { color: isUser ? G.white : (isDark ? colors.text : G.gray900) },
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                    {isUser && (
                      <View style={[styles.userAvatar, { backgroundColor: G.primary }]}>
                        <User color={G.white} size={12} />
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <View style={[styles.messageRow, styles.aiRow]}>
                  <View style={styles.aiAvatar}>
                    <Bot color={G.primary} size={12} />
                  </View>
                  <View
                    style={[
                      styles.messageBubble,
                      styles.aiBubble,
                      {
                        backgroundColor: isDark ? colors.surfaceVariant : G.gray100,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      },
                    ]}
                  >
                    <ActivityIndicator color={G.primary} size="small" />
                    <Text style={{ color: isDark ? colors.textSecondary : G.gray500, fontSize: 11 }}>Đang xử lý...</Text>
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
                    backgroundColor: isDark ? colors.surfaceVariant : G.gray50,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={chatConfig.placeholder}
                placeholderTextColor={isDark ? colors.textMuted : 'rgba(0,0,0,0.3)'}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: G.primary }]}
                onPress={handleSend}
                disabled={!inputText.trim() || loading}
              >
                <Send color={G.white} size={14} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  bubbleContainer: {
    position: 'absolute',
    bottom: 95, // Vị trí thích hợp trên bottom navigation bar
    right: 20,
    zIndex: 9999,
  },
  bubbleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: G.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chatCard: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.58,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 10000,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: G.white,
    fontSize: 13,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  messageList: {
    padding: 12,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  aiRow: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1d933618',
    borderWidth: 1,
    borderColor: '#1d933630',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    fontSize: 12.5,
    borderWidth: 1,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});
