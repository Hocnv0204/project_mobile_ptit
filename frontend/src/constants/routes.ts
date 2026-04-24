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
  QUIZ_MODE_SELECT: 'QuizModeSelect',
  QUIZ_SESSION: 'QuizSession',
  FILL_BLANK_SESSION: 'FillBlankSession',

  // Writing Stack
  WRITING_LIST: 'WritingList',
  SELECT_TOPIC: 'SelectTopic',
  SELECT_LESSON: 'SelectLesson',
  LESSON_PRACTICE: 'LessonPractice',

  // AI Stack
  AI_LESSON_HOME: 'AILessonHome',
  WRITING_GRADE: 'WritingGrade',

  // Dictation Stack
  DICTATION_PLAYER: 'DictationPlayer',

  // Podcast Stack
  PODCAST_LIST: 'PodcastList',
  PODCAST_PLAYER: 'PodcastPlayer',

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
