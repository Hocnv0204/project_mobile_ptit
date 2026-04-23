import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { authApi } from '../../api/authApi';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';
import { useI18n } from '../../i18n/useI18n';

// Reusable menu item component
interface MenuItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof Feather.glyphMap;
  iconFamily?: 'MaterialCommunityIcons' | 'Feather';
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}

const MenuItem = ({ icon, iconFamily = 'MaterialCommunityIcons', label, onPress, isLast = false }: MenuItemProps) => (
  <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress} activeOpacity={0.7}>
    {iconFamily === 'MaterialCommunityIcons' ? (
      <MaterialCommunityIcons name={icon as any} size={24} color="#4A5568" style={styles.menuIcon} />
    ) : (
      <Feather name={icon as any} size={24} color="#4A5568" style={styles.menuIcon} />
    )}
    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { refreshToken, user, logout } = useAuthStore();
  const { signOut: googleSignOut } = useGoogleAuth();
  const { t, language, setLanguage } = useI18n();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        // Option 1: Call API logout
        await authApi.logout({ refreshToken });
      }
      // Option 2: Sign out from Google if applicable
      await googleSignOut();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      // Clear store and secure storage
      logout();
    }
  };

  const displayName = user?.fullName || user?.username || 'Nguyễn Văn Học';
  const displayEmail = user?.email || 'nguyenhh1102@gmail.com';
  // Use a generic placeholder avatar if no URL is provided
  const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=0066FF&color=fff&size=200';

  const levelLabel = useMemo(() => {
    return user?.levelId ? t('profile.level.value', { id: user.levelId }) : t('profile.level.notSelected');
  }, [user?.levelId, t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Section: TÀI KHOẢN */}
        <Text style={styles.sectionTitle}>{t('profile.sections.account')}</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="account-outline" label={t('profile.items.profile')} />
          <MenuItem 
            icon="star-outline" 
            label={t('profile.items.currentLevel', { value: levelLabel })} 
            onPress={() => navigation.navigate(Routes.SELECT_LEVEL)} 
          />
          <MenuItem icon="lock-outline" label={t('profile.items.changePassword')} isLast />
        </View>

        {/* Section: THANH TOÁN */}
        <Text style={styles.sectionTitle}>{t('profile.sections.payment')}</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="file-document-outline" label={t('profile.items.orderHistory')} isLast />
        </View>

        {/* Section: CÔNG CỤ */}
        <Text style={styles.sectionTitle}>{t('profile.sections.tools')}</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="ticket-percent-outline" label={t('profile.items.activationCode')} />
          <MenuItem icon="home-outline" label={t('profile.items.familyManagement')} isLast />
        </View>

        {/* Section: CÀI ĐẶT */}
        <Text style={styles.sectionTitle}>{t('profile.sections.settings')}</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="laptop" label={t('profile.items.deviceManagement')} />
          <MenuItem icon="web" label={t('profile.items.language')} onPress={() => setLanguageModalVisible(true)} />
          <MenuItem icon="file-document-outline" label={t('profile.items.terms')} />
          <MenuItem icon="certificate-outline" label={t('profile.items.privacy')} />
          <MenuItem icon="headphones" label={t('profile.items.support')} />
          <MenuItem icon="logout" label={t('profile.items.logout')} onPress={handleLogout} isLast />
        </View>

        <Text style={styles.versionText}>Phiên bản: 2.30.1</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={languageModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('profile.language.modalTitle')}</Text>

            <Pressable
              style={[styles.langOption, language === 'vi' && styles.langOptionActive]}
              onPress={async () => {
                await setLanguage('vi');
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.langText, language === 'vi' && styles.langTextActive]}>
                {t('profile.language.vietnamese')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.langOption, language === 'en' && styles.langOptionActive]}
              onPress={async () => {
                await setLanguage('en');
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                {t('profile.language.english')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FF', // Light gray/blueish background like home screen
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F6F8FF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  
  // User Card
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#70778C',
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A7BA',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  
  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1D26',
  },

  versionText: {
    fontSize: 14,
    color: '#70778C',
    marginLeft: 4,
    marginBottom: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 4 },
  langOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
  },
  langOptionActive: { backgroundColor: '#1A1D26' },
  langText: { fontSize: 15, fontWeight: '800', color: '#1A1D26' },
  langTextActive: { color: '#FFFFFF' },
});
