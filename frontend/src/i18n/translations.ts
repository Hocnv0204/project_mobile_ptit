export type TranslationKey =
  | 'tabs.study'
  | 'tabs.vocabulary'
  | 'tabs.writing'
  | 'tabs.dictation'
  | 'tabs.podcast'
  | 'tabs.account'
  | 'profile.title'
  | 'profile.sections.account'
  | 'profile.sections.payment'
  | 'profile.sections.tools'
  | 'profile.sections.settings'
  | 'profile.items.profile'
  | 'profile.items.currentLevel'
  | 'profile.items.changePassword'
  | 'profile.items.orderHistory'
  | 'profile.items.activationCode'
  | 'profile.items.familyManagement'
  | 'profile.items.deviceManagement'
  | 'profile.items.language'
  | 'profile.items.terms'
  | 'profile.items.privacy'
  | 'profile.items.support'
  | 'profile.items.logout'
  | 'profile.items.darkMode'
  | 'profile.darkMode.on'
  | 'profile.darkMode.off'
  | 'profile.level.value'
  | 'profile.level.notSelected'
  | 'profile.language.modalTitle'
  | 'profile.language.vietnamese'
  | 'profile.language.english';

export const translations: Record<'vi' | 'en', Record<TranslationKey, string>> = {
  vi: {
    'tabs.study': 'Học tập',
    'tabs.vocabulary': 'Từ vựng',
    'tabs.writing': 'Luyện viết',
    'tabs.dictation': 'Chính tả',
    'tabs.podcast': 'Podcast',
    'tabs.account': 'Tài khoản',

    'profile.title': 'Tài khoản',
    'profile.sections.account': 'TÀI KHOẢN',
    'profile.sections.payment': 'THANH TOÁN',
    'profile.sections.tools': 'CÔNG CỤ',
    'profile.sections.settings': 'CÀI ĐẶT',

    'profile.items.profile': 'Hồ sơ',
    'profile.items.currentLevel': 'Trình độ hiện tại: {{value}}',
    'profile.items.changePassword': 'Đổi mật khẩu',
    'profile.items.orderHistory': 'Lịch sử đơn hàng',
    'profile.items.activationCode': 'Mã kích hoạt',
    'profile.items.familyManagement': 'Quản lý gia đình',
    'profile.items.deviceManagement': 'Quản lý thiết bị',
    'profile.items.language': 'Ngôn ngữ',
    'profile.items.terms': 'Điều khoản & Điều kiện',
    'profile.items.privacy': 'Chính sách bảo mật',
    'profile.items.support': 'Liên hệ/ Hỗ trợ',
    'profile.items.logout': 'Đăng xuất',
    'profile.items.darkMode': 'Chế độ tối',
    'profile.darkMode.on': 'Bật',
    'profile.darkMode.off': 'Tắt',

    'profile.level.value': 'Level {{id}}',
    'profile.level.notSelected': 'Chưa chọn',

    'profile.language.modalTitle': 'Chọn ngôn ngữ',
    'profile.language.vietnamese': 'Tiếng Việt',
    'profile.language.english': 'English',
  },
  en: {
    'tabs.study': 'Study',
    'tabs.vocabulary': 'Vocabulary',
    'tabs.writing': 'Writing',
    'tabs.dictation': 'Dictation',
    'tabs.podcast': 'Podcast',
    'tabs.account': 'Account',

    'profile.title': 'Account',
    'profile.sections.account': 'ACCOUNT',
    'profile.sections.payment': 'PAYMENT',
    'profile.sections.tools': 'TOOLS',
    'profile.sections.settings': 'SETTINGS',

    'profile.items.profile': 'Profile',
    'profile.items.currentLevel': 'Current level: {{value}}',
    'profile.items.changePassword': 'Change password',
    'profile.items.orderHistory': 'Order history',
    'profile.items.activationCode': 'Activation code',
    'profile.items.familyManagement': 'Family management',
    'profile.items.deviceManagement': 'Device management',
    'profile.items.language': 'Language',
    'profile.items.terms': 'Terms & Conditions',
    'profile.items.privacy': 'Privacy policy',
    'profile.items.support': 'Support',
    'profile.items.logout': 'Logout',
    'profile.items.darkMode': 'Dark mode',
    'profile.darkMode.on': 'On',
    'profile.darkMode.off': 'Off',

    'profile.level.value': 'Level {{id}}',
    'profile.level.notSelected': 'Not selected',

    'profile.language.modalTitle': 'Choose language',
    'profile.language.vietnamese': 'Vietnamese',
    'profile.language.english': 'English',
  },
};

