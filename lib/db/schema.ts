import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Study data (Phase III). Participants are identified by study ID only (P-001);
 * no names or contact details are stored. Written consent stays on paper.
 */

export const participants = pgTable("participants", {
  id: text("id").primaryKey(), // P-001
  group: text("group").notNull(), // pharmd_student | trainee | clinician
  experienceYears: real("experience_years"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: text("participant_id")
    .notNull()
    .references(() => participants.id),
  facilitator: text("facilitator"),
  platformVersion: text("platform_version").notNull(),
  scenarioIds: jsonb("scenario_ids").$type<string[]>().notNull(),
  feedback: text("feedback"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/** One row per case scenario attempted: task success, time per task and errors. */
export const taskResults = pgTable("task_results", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id),
  scenarioId: text("scenario_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  durationMs: integer("duration_ms").notNull(),
  answer: text("answer").notNull(),
  correct: boolean("correct").notNull(),
  /** Checks that returned an input error (unknown allele, invalid format, no genotype). */
  inputErrors: integer("input_errors").notNull(),
  checksRun: integer("checks_run").notNull(),
});

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id),
  instrument: text("instrument").notNull(), // SUS | TAM
  responses: jsonb("responses").$type<Record<string, number>>().notNull(),
  /** SUS: 0-100. TAM: per-construct means in `subscales`. */
  score: real("score"),
  subscales: jsonb("subscales").$type<Record<string, number>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
