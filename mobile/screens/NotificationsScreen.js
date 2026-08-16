import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const notifRef = ref(database, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(arr);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notifId) => {
    await update(ref(database, `notifications/${user.uid}/${notifId}`), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
        style={[s.card, !item.read && s.cardUnread]}
        onPress={() => {
        markAsRead(item.id);
        // Navigate to exam detail if exam data exists
        if (item.examData?.courseCode) {
            navigation.navigate('ExamDetail', { exam: item.examData });
        }
        }}
        activeOpacity={0.85}
    >
        <View style={s.cardLeft}>
        <View style={s.cardLeft}>
          <Ionicons
            name={
              item.title?.includes('New')
                ? 'calendar-outline'
                : item.title?.includes('Updated')
                ? 'create-outline'
                : 'trash-outline'
            }
            size={20}
            color="#000666"
          />
        </View>
        </View>
        <View style={s.cardBody}>
        <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>{item.title}</Text>
            {!item.read && <View style={s.unreadDot} />}
        </View>
        <Text style={s.cardBody2} numberOfLines={2}>{item.body}</Text>
        <Text style={s.cardTime}>{formatTime(item.timestamp)}</Text>
        </View>
        {item.examData?.courseCode && (
        <Text style={s.chevron}>›</Text>
        )}
    </TouchableOpacity>
    );

    const handleClearAll = () => {
      Alert.alert(
        'Clear All Notifications',
        'This will permanently delete all your notifications. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: async () => {
              await remove(ref(database, `notifications/${user.uid}`));
            }
          }
        ]
      );
    };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Notifications</Text>
          <Text style={s.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </Text>
        </View>
        <View style={s.headerRight}>
          {unreadCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={s.clearBtn}>
              <Text style={s.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color="#000666" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="notifications-outline" size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <Text style={s.emptyTitle}>No notifications yet</Text>
          <Text style={s.emptySub}>You will be notified here when exam schedules change.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  header: {
    backgroundColor: '#000666',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  headerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0a0a1a', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#000666',
  },
  cardLeft: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0a0a1a', flex: 1 },
  cardBody2: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 6 },
  cardTime: { fontSize: 11, color: '#aaa', fontWeight: '500' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000666',
    marginLeft: 8,
  },
  chevron: {
  fontSize: 22,
  color: '#ccc',
  fontWeight: '300',
  alignSelf: 'center',
 },
 headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
clearBtn: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
},
clearBtnText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},
});