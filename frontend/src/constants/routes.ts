export const Routes = {
  WELCOME: 'Welcome',
  // Auth Stack
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  REGISTER: 'Register',
  EMAIL_VERIFY: 'EmailVerify',
  SELECT_LEVEL: 'SelectLevel',

  // User Bottom Tabs
  HOME: 'Home',
  VOCABULARY: 'Vocabulary',
  WRITING: 'Writing',
  DICTATION: 'Dictation',
  PROFILE: 'Profile',
  PODCAST: 'Podcast',

  // Vocab Stack
  LESSON_DETAIL: 'LessonDetail',
  ADD_VOCAB_AI: 'AddVocabAi',
  AI_VOCAB_RESULT: 'AiVocabResult',
  FLASHCARD: 'Flashcard',

  // AI Stack
  AI_LESSON_HOME: 'AILessonHome',
  WRITING_GRADE: 'WritingGrade',

  // Podcast Stack
  PODCAST_LIST: 'PodcastList',
  PODCAST_PLAYER: 'PodcastPlayer',
  DICTATION: 'Dictation',

  // Admin Drawer
  ADMIN_DASHBOARD: 'AdminDashboard',
  ADMIN_USERS: 'AdminUsers',
  ADMIN_TOPICS: 'AdminTopics',
  ADMIN_LESSONS: 'AdminLessons',

  // Navigators
  AUTH_NAVIGATOR: 'AuthNavigator',
  USER_NAVIGATOR: 'UserNavigator',
  ADMIN_NAVIGATOR: 'AdminNavigator',
} as const;

export type RouteKey = (typeof Routes)[keyof typeof Routes];
