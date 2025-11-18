import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { getCachedConversations, setCachedConversations, mergeConversations, getTotalUnreadCount } from '../utils/chatCache';

interface ChatConversation {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unread_count_user: number;
  unread_count_admin: number;
  last_message?: string;
  last_message_sender?: string;
  resolved: number;
}

interface NotificationSettings {
  desktopNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notificationTypes: {
    newMessage: boolean;
    conversationUpdate: boolean;
    assignment: boolean;
  };
}

export const useGlobalChatWebSocket = (
  authSeed: string,
  onUnreadCountChange?: (count: number) => void,
  onConversationUpdate?: (conversations: ChatConversation[]) => void
) => {
  const [webSocketUrl, setWebSocketUrl] = useState<string>('');
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  const onConversationUpdateRef = useRef(onConversationUpdate);
  const notificationSettingsRef = useRef<NotificationSettings>({
    desktopNotifications: true,
    soundEnabled: true,
    soundVolume: 1.0,
    notificationTypes: {
      newMessage: true,
      conversationUpdate: true,
      assignment: true,
    },
  });
  const notificationPermissionRef = useRef<NotificationPermission>('default');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);

  useEffect(() => {
    onConversationUpdateRef.current = onConversationUpdate;
  }, [onConversationUpdate]);

  // Load notification settings and audio file
  useEffect(() => {
    // Load audio file from public folder
    const audio = new Audio('/notification-sound.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    const saved = localStorage.getItem('chatNotificationSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        notificationSettingsRef.current = {
          ...parsed,
          desktopNotifications: true,
          soundEnabled: true,
          soundVolume: 1.0,
          notificationTypes: {
            newMessage: true,
            conversationUpdate: true,
            assignment: true,
            ...parsed.notificationTypes,
          },
        };
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getWebSocketUrl = useCallback(() => {
    const sessionKey = localStorage.getItem('adminSessionKey');
    if (!sessionKey || !authSeed) {
      return null;
    }

    const backendHost = import.meta.env.VITE_WS_BACKEND_HOST;
    if (!backendHost) {
      console.warn('VITE_WS_BACKEND_HOST not set');
      return null;
    }

    const protocol =
      backendHost.includes('localhost') || backendHost.includes('127.0.0.1')
        ? 'ws:'
        : 'wss:';
    return `${protocol}//${backendHost}/ws/chat?session_key=${encodeURIComponent(sessionKey)}&auth_seed=${encodeURIComponent(authSeed)}`;
  }, [authSeed]);

  const playNotificationSound = useCallback(() => {
    if (!notificationSettingsRef.current.soundEnabled) {
      return;
    }

    if (audioRef.current) {
      try {
        const audio = audioRef.current;
        audio.volume = notificationSettingsRef.current.soundVolume;
        audio.currentTime = 0; // Reset to start
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Failed to play notification sound:', error);
            // Fallback to Web Audio API if file fails
            try {
              const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
              oscillator.type = 'sine';

              gainNode.gain.setValueAtTime(0, audioContext.currentTime);
              gainNode.gain.linearRampToValueAtTime(
                notificationSettingsRef.current.soundVolume * 0.3,
                audioContext.currentTime + 0.01,
              );
              gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + 0.3,
              );

              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.3);
            } catch (fallbackError) {
              console.error('Failed to play fallback sound:', fallbackError);
            }
          });
        }
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }
  }, []);

  const showNotificationInternal = useCallback((
    title: string,
    body: string,
    type: 'newMessage' | 'conversationUpdate' | 'assignment' = 'newMessage',
  ) => {
    const settings = notificationSettingsRef.current;
    
    if (!settings.desktopNotifications || !settings.notificationTypes[type]) {
      return;
    }

    // Play sound first
    playNotificationSound();

    // Always show notification even when window is focused
    if (notificationPermissionRef.current === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `chat-${type}-${Date.now()}`, // Unique tag to show multiple notifications
          requireInteraction: false,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    } else if (notificationPermissionRef.current === 'default') {
      // Request permission if not yet requested
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          notificationPermissionRef.current = permission;
          if (permission === 'granted') {
            // Retry showing notification
            showNotificationInternal(title, body, type);
          }
        });
      }
    }
  }, [playNotificationSound]);

  const showNotification = useCallback((
    title: string,
    body: string,
    type: 'newMessage' | 'conversationUpdate' | 'assignment' = 'newMessage',
  ) => {
    showNotificationInternal(title, body, type);
  }, [showNotificationInternal]);

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.message_type) {
      case 'new_message':
        const newMsg = message.data;
        
        // Update conversations cache
        const currentConversations = getCachedConversations() || [];
        const updatedConversations = currentConversations.map((conv) =>
          conv.id === newMsg.conversation_id
            ? {
                ...conv,
                last_message: newMsg.message,
                last_message_sender: newMsg.sender_name,
                last_message_at: newMsg.created_at,
                unread_count_admin:
                  newMsg.sender_type === 'user'
                    ? conv.unread_count_admin + 1
                    : conv.unread_count_admin,
                resolved: newMsg.sender_type === 'user' ? 0 : conv.resolved,
              }
            : conv,
        );
        
        setCachedConversations(updatedConversations);
        
        // Notify parent of conversation updates
        if (onConversationUpdateRef.current) {
          onConversationUpdateRef.current(updatedConversations);
        }
        
        // Update unread count
        const unreadCount = updatedConversations.reduce(
          (total, conv) => total + conv.unread_count_admin,
          0,
        );
        if (onUnreadCountChangeRef.current) {
          onUnreadCountChangeRef.current(unreadCount);
        }
        
        // Show notification for new user messages
        if (newMsg.sender_type === 'user') {
          const conversation = updatedConversations.find(
            (conv) => conv.id === newMsg.conversation_id,
          );
          if (conversation) {
            showNotification(
              `New message from ${conversation.user_name}`,
              newMsg.message.length > 50
                ? newMsg.message.substring(0, 50) + '...'
                : newMsg.message,
              'newMessage',
            );
          }
        }
        break;
        
      case 'conversation_update':
        const updatedConv = message.data;
        const existingConversations = getCachedConversations() || [];
        const exists = existingConversations.some((conv) => conv.id === updatedConv.id);
        
        let resultConversations: ChatConversation[];
        if (!exists) {
          const newConv: ChatConversation = {
            id: updatedConv.id,
            user_id: updatedConv.user_id,
            user_name: updatedConv.user_name,
            status: updatedConv.status,
            assigned_admin_id: updatedConv.assigned_admin_id,
            assigned_admin_name: updatedConv.assigned_admin_name,
            created_at: updatedConv.updated_at,
            updated_at: updatedConv.updated_at,
            last_message_at: updatedConv.updated_at,
            unread_count_user: 0,
            unread_count_admin: updatedConv.unread_count_admin || 0,
            last_message: updatedConv.last_message,
            last_message_sender: updatedConv.last_message_sender,
            resolved: updatedConv.resolved || 0,
          };
          resultConversations = [newConv, ...existingConversations];
          
          // Show notification for new conversation
          const notificationBody = updatedConv.last_message
            ? updatedConv.last_message.length > 50
              ? updatedConv.last_message.substring(0, 50) + '...'
              : updatedConv.last_message
            : 'New conversation started';
          showNotification(
            `New conversation from ${updatedConv.user_name}`,
            notificationBody,
            'conversationUpdate',
          );
        } else {
          resultConversations = existingConversations.map((conv) =>
            conv.id === updatedConv.id
              ? {
                  ...conv,
                  ...updatedConv,
                  last_message: updatedConv.last_message || conv.last_message,
                  last_message_sender:
                    updatedConv.last_message_sender || conv.last_message_sender,
                }
              : conv,
          );
        }
        
        setCachedConversations(resultConversations);
        
        // Notify parent of conversation updates
        if (onConversationUpdateRef.current) {
          onConversationUpdateRef.current(resultConversations);
        }
        
        // Update unread count
        const newUnreadCount = resultConversations.reduce(
          (total, conv) => total + conv.unread_count_admin,
          0,
        );
        if (onUnreadCountChangeRef.current) {
          onUnreadCountChangeRef.current(newUnreadCount);
        }
        break;
        
      case 'connection_established':
      case 'subscription_confirmed':
      case 'pong':
        break;
        
      case 'error':
        console.error('WebSocket error:', message.data?.message);
        break;
        
      default:
        break;
    }
  }, [showNotification]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let loadHandler: (() => void) | null = null;
    let delayedTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Delay WebSocket connection until page is fully loaded and session is ready
    const connectWebSocket = () => {
      // Check if session key exists before attempting connection
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey || !authSeed) {
        // Session not ready yet, retry after a delay
        retryTimeoutId = setTimeout(connectWebSocket, 2000);
        return;
      }

      // Check if page is fully loaded
      if (document.readyState === 'complete') {
        // Add a small delay after page load to ensure everything is ready
        delayedTimeoutId = setTimeout(() => {
          const url = getWebSocketUrl();
          if (url) {
            setWebSocketUrl(url);
          }
        }, 500);
      } else {
        // Wait for page to be fully loaded
        loadHandler = () => {
          // Add a small delay after page load to ensure everything is ready
          delayedTimeoutId = setTimeout(() => {
            const url = getWebSocketUrl();
            if (url) {
              setWebSocketUrl(url);
            }
          }, 500);
        };
        
        if (document.readyState === 'loading') {
          window.addEventListener('load', loadHandler, { once: true });
        } else {
          // Interactive state - page is loading but not complete
          delayedTimeoutId = setTimeout(() => {
            const url = getWebSocketUrl();
            if (url) {
              setWebSocketUrl(url);
            }
          }, 1000);
        }
      }
    };

    // Small delay to ensure session is established
    timeoutId = setTimeout(connectWebSocket, 1000);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (delayedTimeoutId) clearTimeout(delayedTimeoutId);
      if (loadHandler) {
        window.removeEventListener('load', loadHandler);
      }
    };
  }, [getWebSocketUrl]);

  const {
    isConnected,
    connectionStatus,
    sendMessage: sendWebSocketMessage,
  } = useWebSocket({
    url: webSocketUrl && authSeed ? webSocketUrl : '',
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('Global chat WebSocket connected');
    },
    onClose: () => {
      console.log('Global chat WebSocket disconnected');
    },
    onError: (error) => {
      // Silently handle WebSocket errors to reduce console spam
      // Errors are expected when the server is unavailable
    },
  });

  return {
    isConnected,
    connectionStatus,
    sendMessage: sendWebSocketMessage,
  };
};

