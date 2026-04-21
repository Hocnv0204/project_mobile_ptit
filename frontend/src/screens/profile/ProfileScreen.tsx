import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  Image
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearAuth, clearPersistedAuth } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';

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
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { refreshToken, user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      await clearPersistedAuth();
      dispatch(clearAuth());
    }
  };

  const displayName = user?.fullName || user?.username || 'Nguyễn Văn Học';
  const displayEmail = user?.email || 'nguyenhh1102@gmail.com';
  // Use a generic placeholder avatar if no URL is provided
  const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=0066FF&color=fff&size=200';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Section: TÀI KHOẢN */}
        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="account-outline" label="Hồ sơ" />
          <MenuItem 
            icon="star-outline" 
            label={`Trình độ hiện tại: ${user?.levelId ? 'Đã chọn' : 'Chưa chọn'}`} 
            onPress={() => navigation.navigate(Routes.SELECT_LEVEL)} 
          />
          <MenuItem icon="lock-outline" label="Đổi mật khẩu" isLast />
        </View>

        {/* Section: THANH TOÁN */}
        <Text style={styles.sectionTitle}>THANH TOÁN</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="file-document-outline" label="Lịch sử đơn hàng" isLast />
        </View>

        {/* Section: CÔNG CỤ */}
        <Text style={styles.sectionTitle}>CÔNG CỤ</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="ticket-percent-outline" label="Mã kích hoạt" />
          <MenuItem icon="home-outline" label="Quản lý gia đình" isLast />
        </View>

        {/* Section: CÀI ĐẶT */}
        <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>
        <View style={styles.sectionContainer}>
          <MenuItem icon="laptop" label="Quản lý thiết bị" />
          <MenuItem icon="web" label="Ngôn ngữ" />
          <MenuItem icon="file-document-outline" label="Điều khoản & Điều kiện" />
          <MenuItem icon="certificate-outline" label="Chính sách bảo mật" />
          <MenuItem icon="headphones" label="Liên hệ/ Hỗ trợ" />
          <MenuItem icon="logout" label="Đăng xuất" onPress={handleLogout} isLast />
        </View>

        <Text style={styles.versionText}>Phiên bản: 2.30.1</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  }
});
