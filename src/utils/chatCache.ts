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

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: string;
  attachment_url?: string;
  is_read: number;
  created_at: string;
  is_admin_note?: boolean;
  admin_note?: string;
}

interface ConversationsResponse {
  success: boolean;
  message?: string;
  conversations?: ChatConversation[];
}

interface MessagesResponse {
  success: boolean;
  message?: string;
  messages?: ChatMessage[];
}

interface ChatLicenseStatus {
  is_licensed: boolean;
  server_name: string;
}

interface CacheEntry {
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  licenseStatus: ChatLicenseStatus | null;
  timestamp: number;
}

const CACHE_KEY = 'chatManagementCache';
const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutes (chat data changes frequently)

export function getCachedConversations(): ChatConversation[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.conversations;
  } catch (error) {
    console.error('Error reading chat cache:', error);
    return null;
  }
}

export function getCachedMessages(conversationId: string): ChatMessage[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.messages[conversationId] || null;
  } catch (error) {
    console.error('Error reading chat messages cache:', error);
    return null;
  }
}

export function setCachedConversations(conversations: ChatConversation[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const entry: CacheEntry = cached ? JSON.parse(cached) : {
      conversations: [],
      messages: {},
      licenseStatus: null,
      timestamp: Date.now(),
    };

    entry.conversations = conversations;
    entry.timestamp = Date.now();
    // Preserve licenseStatus if it exists
    if (!entry.licenseStatus) {
      entry.licenseStatus = null;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing chat cache:', error);
  }
}

export function setCachedMessages(conversationId: string, messages: ChatMessage[]): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const entry: CacheEntry = cached ? JSON.parse(cached) : {
      conversations: [],
      messages: {},
      licenseStatus: null,
      timestamp: Date.now(),
    };

    entry.messages[conversationId] = messages;
    entry.timestamp = Date.now();
    // Preserve licenseStatus if it exists
    if (!entry.licenseStatus) {
      entry.licenseStatus = null;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing chat messages cache:', error);
  }
}

export function mergeConversations(
  existing: ChatConversation[],
  newConversations: ChatConversation[]
): ChatConversation[] {
  const existingMap = new Map(existing.map(c => [c.id, c]));
  
  newConversations.forEach(conversation => {
    const existing = existingMap.get(conversation.id);
    if (existing) {
      // Merge, keeping the one with more recent updated_at
      const existingTime = new Date(existing.updated_at).getTime();
      const newTime = new Date(conversation.updated_at).getTime();
      if (newTime > existingTime) {
        existingMap.set(conversation.id, conversation);
      } else {
        // Keep existing but update unread count if new one has higher
        if (conversation.unread_count_admin > existing.unread_count_admin) {
          existingMap.set(conversation.id, {
            ...existing,
            unread_count_admin: conversation.unread_count_admin,
          });
        }
      }
    } else {
      existingMap.set(conversation.id, conversation);
    }
  });

  return Array.from(existingMap.values()).sort((a, b) => {
    const aTime = new Date(a.last_message_at || a.updated_at).getTime();
    const bTime = new Date(b.last_message_at || b.updated_at).getTime();
    return bTime - aTime;
  });
}

export function mergeMessages(
  existing: ChatMessage[],
  newMessages: ChatMessage[]
): ChatMessage[] {
  const existingMap = new Map(existing.map(m => [m.id, m]));
  
  newMessages.forEach(message => {
    existingMap.set(message.id, message);
  });

  return Array.from(existingMap.values()).sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function clearChatCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing chat cache:', error);
  }
}

export function getTotalUnreadCount(): number {
  try {
    const conversations = getCachedConversations();
    if (!conversations) return 0;
    
    return conversations.reduce((total, conv) => total + conv.unread_count_admin, 0);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export function getCachedLicenseStatus(): ChatLicenseStatus | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      return null;
    }

    return entry.licenseStatus;
  } catch (error) {
    console.error('Error reading license cache:', error);
    return null;
  }
}

export function setCachedLicenseStatus(licenseStatus: ChatLicenseStatus | null): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const entry: CacheEntry = cached ? JSON.parse(cached) : {
      conversations: [],
      messages: {},
      licenseStatus: null,
      timestamp: Date.now(),
    };

    entry.licenseStatus = licenseStatus;
    entry.timestamp = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing license cache:', error);
  }
}

export function preloadChatConversations(authSeed: string): Promise<ChatConversation[] | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/chat/conversations');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data: ConversationsResponse = await response.json();

      if (data.success && data.conversations) {
        setCachedConversations(data.conversations);
        resolve(data.conversations);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading chat conversations:', error);
      resolve(null);
    }
  });
}

