import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export auth models so they are included in the schema
export * from "./models/auth";
import { users } from "./models/auth";

// === LEVELS / SONGS ===
export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subTitle: text("sub_title"), // e.g. "Surah Al-Fatiha" or "Mishary Alafasy"
  artist: text("artist").notNull(),
  type: text("type", { enum: ["quran", "nasheed", "knowledge"] }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  audioUrl: text("audio_url").notNull(),
  coverUrl: text("cover_url"),
  bpm: integer("bpm").default(120),
  duration: integer("duration").notNull(), // in seconds
  
  // JSONB for game data: tile positions/timing, and educational content
  // Structure: { 
  //   tiles: [{ time: 1.2, lane: 0, type: 'tap' }, ...], 
  //   quiz: [{ question: "...", options: ["..."], answer: 0 }] 
  // }
  gameData: jsonb("game_data").notNull(),
});

// === SCORES ===
export const levelScores = pgTable("level_scores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  levelId: integer("level_id").notNull().references(() => levels.id),
  score: integer("score").notNull(),
  stars: integer("stars").notNull(), // 1-3 stars
  accuracy: integer("accuracy").notNull(), // percentage 0-100
  maxStreak: integer("max_streak").notNull(),
  isFullCombo: boolean("is_full_combo").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const levelsRelations = relations(levels, ({ many }) => ({
  scores: many(levelScores),
}));

export const scoresRelations = relations(levelScores, ({ one }) => ({
  level: one(levels, {
    fields: [levelScores.levelId],
    references: [levels.id],
  }),
  user: one(users, {
    fields: [levelScores.userId],
    references: [users.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertLevelSchema = createInsertSchema(levels).omit({ id: true });
export const insertScoreSchema = createInsertSchema(levelScores).omit({ id: true, createdAt: true });

// === TYPES ===
export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type LevelScore = typeof levelScores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;

export type GameData = {
  tiles: {
    time: number; // Time in seconds when tile should be hit
    lane: 0 | 1 | 2 | 3; // 4 lanes
    type: 'tap' | 'hold';
    duration?: number; // For hold notes
    word?: string; // Optional: word to display on tile (for Quran/Knowledge)
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
};

export type LevelResponse = Level;
export type ScoreResponse = LevelScore & { level?: Level };
