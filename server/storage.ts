import { db } from "./db";
import { 
  levels, levelScores, users,
  type Level, type InsertLevel, 
  type LevelScore, type InsertScore,
  type User
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage"; // Use the auth storage for user ops

export interface IStorage {
  // Levels
  getLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  createLevel(level: InsertLevel): Promise<Level>;
  
  // Scores
  createScore(score: InsertScore): Promise<LevelScore>;
  getUserScores(userId: string): Promise<(LevelScore & { level: Level })[]>;
  getLeaderboard(levelId: number): Promise<{ username: string; score: number; accuracy: number; isFullCombo: boolean }[]>;
}

export class DatabaseStorage implements IStorage {
  // Levels
  async getLevels(): Promise<Level[]> {
    return await db.select().from(levels);
  }

  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    const [newLevel] = await db.insert(levels).values(level).returning();
    return newLevel;
  }

  // Scores
  async createScore(score: InsertScore): Promise<LevelScore> {
    const [newScore] = await db.insert(levelScores).values(score).returning();
    return newScore;
  }

  async getUserScores(userId: string): Promise<(LevelScore & { level: Level })[]> {
    // Join level_scores with levels
    const results = await db.select()
      .from(levelScores)
      .innerJoin(levels, eq(levelScores.levelId, levels.id))
      .where(eq(levelScores.userId, userId))
      .orderBy(desc(levelScores.createdAt));
      
    return results.map(({ level_scores, levels }) => ({
      ...level_scores,
      level: levels
    }));
  }

  async getLeaderboard(levelId: number): Promise<{ username: string; score: number; accuracy: number; isFullCombo: boolean }[]> {
    const results = await db.select({
      username: users.email, // using email or name if available
      score: levelScores.score,
      accuracy: levelScores.accuracy,
      isFullCombo: levelScores.isFullCombo
    })
    .from(levelScores)
    .innerJoin(users, eq(levelScores.userId, users.id))
    .where(eq(levelScores.levelId, levelId))
    .orderBy(desc(levelScores.score))
    .limit(10);

    return results.map(r => ({
      ...r,
      username: r.username?.split('@')[0] || "Anonymous" // Simple username derivation
    }));
  }
}

export const storage = new DatabaseStorage();
