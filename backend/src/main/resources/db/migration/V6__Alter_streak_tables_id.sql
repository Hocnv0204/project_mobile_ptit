-- Create sequence for user_streaks and alter column
CREATE SEQUENCE IF NOT EXISTS user_streaks_id_seq;
ALTER TABLE user_streaks ALTER COLUMN id SET DEFAULT nextval('user_streaks_id_seq');
ALTER SEQUENCE user_streaks_id_seq OWNED BY user_streaks.id;

-- Create sequence for streak_activities and alter column
CREATE SEQUENCE IF NOT EXISTS streak_activities_id_seq;
ALTER TABLE streak_activities ALTER COLUMN id SET DEFAULT nextval('streak_activities_id_seq');
ALTER SEQUENCE streak_activities_id_seq OWNED BY streak_activities.id;
