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
  uuid,
} from 'drizzle-orm/pg-core';

// Supabase's own auth schema — referenced, never managed by this project's migrations.
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name'),
  age: integer('age'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['client', 'coach'] }).notNull().default('client'),
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
  coachId: uuid('coach_id').notNull().default(sql`auth.uid()`).references(() => profiles.id, { onDelete: 'cascade' }),
  // Nullable until the invite is accepted -- at invite time we only know the email.
  clientId: uuid('client_id').references(() => profiles.id, { onDelete: 'cascade' }),
  clientEmail: text('client_email').notNull(),
  inviteToken: uuid('invite_token').notNull().defaultRandom().unique(),
  status: text('status', { enum: ['pending', 'accepted', 'revoked'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

// Platform-level invites for onboarding a new coach (you send this link when a
// coach buys in or wants a demo). Deliberately separate from coach_client_links,
// which is a coach inviting their own clients -- this is one level up.
export const coachInvites = pgTable('coach_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  inviteToken: uuid('invite_token').notNull().defaultRandom().unique(),
  status: text('status', { enum: ['pending', 'accepted', 'revoked'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().default(sql`auth.uid()`).references(() => profiles.id, { onDelete: 'cascade' }),
  subscription: jsonb('subscription').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
