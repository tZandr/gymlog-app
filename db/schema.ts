import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Supabase's own auth schema — referenced, never managed by this project's migrations.
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  // Lowercase handle without the leading '@' (the UI shows it as @username). Unique, format-checked in SQL.
  username: text('username'),
  name: text('name'),
  age: integer('age'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  // Shown in the coach directory.
  coachTags: text('coach_tags').array().notNull().default([]),
  // Set only by the admin bootstrap script or an accepted admin invite -- never writable from the app.
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  muscleGroups: text('muscle_groups').array().notNull().default([]),
  category: text('category').array().notNull().default([]),
  brand: text('brand'),
  baseExerciseId: uuid('base_exercise_id').references((): any => exercises.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().default(sql`auth.uid()`).references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  gym: text('gym'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  notes: text('notes'),
  rating: integer('rating'),
  isTemplate: boolean('is_template').notNull().default(false),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'restrict' }),
  exerciseName: text('exercise_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutExerciseId: uuid('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  reps: integer('reps').notNull(),
  weight: doublePrecision('weight').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coachClientLinks = pgTable('coach_client_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // A coach invites a client by @username; the client accepts or declines in their dashboard.
  status: text('status', { enum: ['pending', 'accepted', 'declined'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (t) => [unique('coach_client_links_pair_key').on(t.coachId, t.clientId)]);

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().default(sql`auth.uid()`).references(() => profiles.id, { onDelete: 'cascade' }),
  subscription: jsonb('subscription').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Coach tools are paywalled: a row here (not expired) is what grants access. 'granted' rows are
// created by an admin; 'paid' rows will be created by the payment integration.
export const coachSubscriptions = pgTable('coach_subscriptions', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  source: text('source', { enum: ['granted', 'paid'] }).notNull(),
  grantedBy: uuid('granted_by').references(() => profiles.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Someone without coach access asking an admin to be let in.
export const coachAccessRequests = pgTable('coach_access_requests', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// An admin inviting an existing user to become an admin; the invitee accepts in their Settings.
export const adminInvites = pgTable('admin_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  invitedUserId: uuid('invited_user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['pending', 'accepted', 'declined'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// A program is a named list of days. It starts as a coach's draft (client_id null) and is
// 'sent' to one accepted client; later edits by the coach show up for the client live.
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => profiles.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'sent'] }).notNull().default('draft'),
  message: text('message'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const programDays = pgTable('program_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

export const programExercises = pgTable('program_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayId: uuid('day_id').notNull().references(() => programDays.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  // reps/rest are free text on purpose: '6–8', '30–45 s', '2–3 min'.
  sets: integer('sets'),
  reps: text('reps'),
  rest: text('rest'),
  feeder: text('feeder'),
  comment: text('comment'),
  link: text('link'),
});
