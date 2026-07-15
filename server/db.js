const { DatabaseSync } = require('node:sqlite')
const path = require('node:path')

const db = new DatabaseSync(process.env.fitnation_db || path.join(__dirname, '..', 'data', 'fitnation.db'))

db.exec('pragma journal_mode = wal')
db.exec('pragma foreign_keys = on')

db.exec(`
create table if not exists users (
  id integer primary key autoincrement,
  email text unique not null,
  password text not null,
  name text not null,
  created text not null default (datetime('now')),
  goal_cal integer not null default 2200,
  goal_protein integer not null default 140,
  goal_water integer not null default 3000,
  goal_weight real,
  goal_workouts integer not null default 4,
  units text not null default 'metric'
);

create table if not exists exercises (
  id integer primary key autoincrement,
  name text not null,
  muscle text not null,
  equipment text not null,
  difficulty text not null,
  cues text not null default ''
);

create table if not exists workouts (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  name text not null,
  note text not null default '',
  started text not null default (datetime('now')),
  ended text
);

create table if not exists sets (
  id integer primary key autoincrement,
  workout_id integer not null references workouts(id) on delete cascade,
  exercise_id integer not null references exercises(id),
  weight real not null default 0,
  reps integer not null default 0,
  rpe real,
  created text not null default (datetime('now'))
);

create table if not exists foods (
  id integer primary key autoincrement,
  name text not null,
  cal real not null,
  protein real not null,
  carbs real not null,
  fat real not null,
  serving text not null default '100 g'
);

create table if not exists meals (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  food_id integer not null references foods(id),
  qty real not null default 1,
  slot text not null default 'snack',
  date text not null default (date('now'))
);

create table if not exists water (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  ml integer not null,
  date text not null default (date('now'))
);

create table if not exists weights (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  kg real not null,
  date text not null default (date('now'))
);

create table if not exists templates (
  id integer primary key autoincrement,
  user_id integer not null references users(id) on delete cascade,
  name text not null,
  data text not null default '[]',
  created text not null default (datetime('now'))
);

create index if not exists idx_templates_user on templates(user_id);
create index if not exists idx_workouts_user on workouts(user_id, started);
create index if not exists idx_sets_workout on sets(workout_id);
create index if not exists idx_meals_user on meals(user_id, date);
create index if not exists idx_water_user on water(user_id, date);
create index if not exists idx_weights_user on weights(user_id, date);
`)

for (const ddl of [
  'alter table workouts add column template_id integer',
  'alter table exercises add column user_id integer',
]) {
  try { db.exec(ddl) } catch {}
}

function seed() {
  const count = db.prepare('select count(*) as n from exercises').get().n
  if (count > 0) return

  const ex = db.prepare('insert into exercises (name, muscle, equipment, difficulty, cues) values (?, ?, ?, ?, ?)')
  const exercises = [
    ['barbell back squat', 'legs', 'barbell', 'intermediate', 'brace hard, sit between hips, drive knees out'],
    ['front squat', 'legs', 'barbell', 'advanced', 'elbows high, upright torso, full depth'],
    ['romanian deadlift', 'hamstrings', 'barbell', 'intermediate', 'hinge at hips, soft knees, bar close to legs'],
    ['conventional deadlift', 'back', 'barbell', 'intermediate', 'slack out of the bar, push the floor away'],
    ['leg press', 'legs', 'machine', 'beginner', 'feet shoulder width, control the negative'],
    ['walking lunge', 'legs', 'dumbbell', 'beginner', 'long stride, torso tall, knee tracks toes'],
    ['bulgarian split squat', 'legs', 'dumbbell', 'intermediate', 'rear foot elevated, drop straight down'],
    ['leg extension', 'quads', 'machine', 'beginner', 'pause at the top, slow eccentric'],
    ['lying leg curl', 'hamstrings', 'machine', 'beginner', 'hips down, squeeze at full flexion'],
    ['standing calf raise', 'calves', 'machine', 'beginner', 'full stretch at bottom, pause at top'],
    ['hip thrust', 'glutes', 'barbell', 'beginner', 'chin tucked, posterior tilt at lockout'],
    ['goblet squat', 'legs', 'dumbbell', 'beginner', 'elbows inside knees, chest proud'],
    ['bench press', 'chest', 'barbell', 'intermediate', 'shoulder blades pinned, feet planted, bar to lower chest'],
    ['incline bench press', 'chest', 'barbell', 'intermediate', '30 degree bench, touch high on chest'],
    ['dumbbell bench press', 'chest', 'dumbbell', 'beginner', 'deep stretch, press slightly inward'],
    ['incline dumbbell press', 'chest', 'dumbbell', 'beginner', 'elbows 45 degrees, full range'],
    ['cable fly', 'chest', 'cable', 'beginner', 'slight bend in elbows, hug a barrel'],
    ['push up', 'chest', 'bodyweight', 'beginner', 'body a straight line, full lockout'],
    ['dips', 'chest', 'bodyweight', 'intermediate', 'lean forward, elbows to 90'],
    ['machine chest press', 'chest', 'machine', 'beginner', 'seat height so handles meet mid chest'],
    ['overhead press', 'shoulders', 'barbell', 'intermediate', 'glutes tight, head through at lockout'],
    ['seated dumbbell press', 'shoulders', 'dumbbell', 'beginner', 'elbows slightly forward, no lumbar arch'],
    ['lateral raise', 'shoulders', 'dumbbell', 'beginner', 'lead with elbows, pour the pitcher'],
    ['cable lateral raise', 'shoulders', 'cable', 'beginner', 'constant tension, no swing'],
    ['rear delt fly', 'shoulders', 'dumbbell', 'beginner', 'hinge over, thumbs down, no momentum'],
    ['face pull', 'shoulders', 'cable', 'beginner', 'pull to forehead, external rotate at end'],
    ['arnold press', 'shoulders', 'dumbbell', 'intermediate', 'rotate palms through the press'],
    ['pull up', 'back', 'bodyweight', 'intermediate', 'chest to bar, full hang at bottom'],
    ['chin up', 'back', 'bodyweight', 'intermediate', 'supinated grip, elbows to ribs'],
    ['lat pulldown', 'back', 'cable', 'beginner', 'drive elbows down, chest up'],
    ['barbell row', 'back', 'barbell', 'intermediate', 'hinge 45 degrees, pull to belt line'],
    ['dumbbell row', 'back', 'dumbbell', 'beginner', 'flat back, row to hip'],
    ['seated cable row', 'back', 'cable', 'beginner', 'squeeze shoulder blades, no torso swing'],
    ['t-bar row', 'back', 'barbell', 'intermediate', 'chest supported if possible, big stretch'],
    ['straight arm pulldown', 'lats', 'cable', 'beginner', 'arms locked, sweep to thighs'],
    ['back extension', 'lower back', 'bodyweight', 'beginner', 'squeeze glutes at top, no hyperextension'],
    ['barbell curl', 'biceps', 'barbell', 'beginner', 'elbows pinned, no swing'],
    ['dumbbell curl', 'biceps', 'dumbbell', 'beginner', 'supinate on the way up'],
    ['hammer curl', 'biceps', 'dumbbell', 'beginner', 'neutral grip, control the negative'],
    ['incline curl', 'biceps', 'dumbbell', 'intermediate', 'arms hang back, huge stretch'],
    ['preacher curl', 'biceps', 'machine', 'beginner', 'full extension, no bounce'],
    ['cable pushdown', 'triceps', 'cable', 'beginner', 'elbows glued to sides, full lockout'],
    ['overhead cable extension', 'triceps', 'cable', 'beginner', 'elbows narrow, deep stretch'],
    ['skull crusher', 'triceps', 'barbell', 'intermediate', 'lower behind head, elbows in'],
    ['close grip bench press', 'triceps', 'barbell', 'intermediate', 'hands shoulder width, tuck elbows'],
    ['plank', 'core', 'bodyweight', 'beginner', 'ribs down, glutes on, breathe'],
    ['hanging leg raise', 'core', 'bodyweight', 'intermediate', 'posterior tilt, no swing'],
    ['cable crunch', 'core', 'cable', 'beginner', 'flex the spine, hips still'],
    ['russian twist', 'core', 'bodyweight', 'beginner', 'rotate from the ribs, slow'],
    ['ab wheel rollout', 'core', 'bodyweight', 'advanced', 'hollow body, no lumbar sag'],
    ['farmer carry', 'full body', 'dumbbell', 'beginner', 'tall posture, quick steps'],
    ['kettlebell swing', 'full body', 'kettlebell', 'intermediate', 'hinge not squat, snap the hips'],
    ['treadmill run', 'cardio', 'machine', 'beginner', 'easy conversational pace for zone 2'],
    ['rowing machine', 'cardio', 'machine', 'beginner', 'legs, then body, then arms'],
    ['assault bike', 'cardio', 'machine', 'intermediate', 'push and pull, steady rpm'],
    ['stair climber', 'cardio', 'machine', 'beginner', 'no leaning on rails'],
    ['jump rope', 'cardio', 'bodyweight', 'beginner', 'wrists spin, soft knees'],
    ['box jump', 'legs', 'bodyweight', 'intermediate', 'land soft, step down'],
    ['burpee', 'full body', 'bodyweight', 'intermediate', 'chest to floor, jump at top'],
    ['sled push', 'full body', 'machine', 'intermediate', 'low body angle, drive through toes'],
  ]
  for (const row of exercises) ex.run(...row)

  const food = db.prepare('insert into foods (name, cal, protein, carbs, fat, serving) values (?, ?, ?, ?, ?, ?)')
  const foods = [
    ['chicken breast', 165, 31, 0, 3.6, '100 g'],
    ['chicken thigh', 209, 26, 0, 11, '100 g'],
    ['salmon', 208, 20, 0, 13, '100 g'],
    ['tuna (canned)', 116, 26, 0, 1, '100 g'],
    ['lean beef (95/5)', 137, 21, 0, 5, '100 g'],
    ['egg', 72, 6.3, 0.4, 4.8, '1 large'],
    ['egg whites', 52, 11, 0.7, 0.2, '100 g'],
    ['greek yogurt (0%)', 59, 10, 3.6, 0.4, '100 g'],
    ['cottage cheese', 98, 11, 3.4, 4.3, '100 g'],
    ['whey protein', 120, 24, 3, 1.5, '1 scoop'],
    ['tofu', 76, 8, 1.9, 4.8, '100 g'],
    ['paneer', 265, 18, 1.2, 21, '100 g'],
    ['lentils (cooked)', 116, 9, 20, 0.4, '100 g'],
    ['chickpeas (cooked)', 164, 8.9, 27, 2.6, '100 g'],
    ['white rice (cooked)', 130, 2.7, 28, 0.3, '100 g'],
    ['brown rice (cooked)', 112, 2.6, 24, 0.9, '100 g'],
    ['oats (dry)', 389, 17, 66, 7, '100 g'],
    ['whole wheat roti', 104, 3.5, 20, 1.2, '1 piece'],
    ['sweet potato', 86, 1.6, 20, 0.1, '100 g'],
    ['potato', 77, 2, 17, 0.1, '100 g'],
    ['banana', 105, 1.3, 27, 0.4, '1 medium'],
    ['apple', 95, 0.5, 25, 0.3, '1 medium'],
    ['blueberries', 57, 0.7, 14, 0.3, '100 g'],
    ['avocado', 160, 2, 8.5, 15, '100 g'],
    ['almonds', 579, 21, 22, 50, '100 g'],
    ['peanut butter', 94, 4, 3, 8, '1 tbsp'],
    ['olive oil', 119, 0, 0, 13.5, '1 tbsp'],
    ['broccoli', 34, 2.8, 7, 0.4, '100 g'],
    ['spinach', 23, 2.9, 3.6, 0.4, '100 g'],
    ['milk (whole)', 61, 3.2, 4.8, 3.3, '100 ml'],
    ['milk (skim)', 34, 3.4, 5, 0.1, '100 ml'],
    ['cheddar cheese', 403, 25, 1.3, 33, '100 g'],
    ['pasta (cooked)', 131, 5, 25, 1.1, '100 g'],
    ['bread (whole wheat)', 81, 4, 14, 1.1, '1 slice'],
    ['dark chocolate', 546, 4.9, 61, 31, '100 g'],
    ['protein bar', 200, 20, 22, 7, '1 bar'],
  ]
  for (const row of foods) food.run(...row)
}

seed()

module.exports = db
