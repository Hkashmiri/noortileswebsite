import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { GameData } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // === PUBLIC ROUTES ===
  
  app.get(api.levels.list.path, async (req, res) => {
    const levels = await storage.getLevels();
    res.json(levels);
  });

  app.get(api.levels.get.path, async (req, res) => {
    const level = await storage.getLevel(Number(req.params.id));
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }
    res.json(level);
  });

  app.get(api.scores.getLeaderboard.path, async (req, res) => {
    const leaderboard = await storage.getLeaderboard(Number(req.params.levelId));
    res.json(leaderboard);
  });

  // === PROTECTED ROUTES ===
  
  app.post(api.scores.submit.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.scores.submit.input.parse(req.body);
      
      // Ensure the user submits for themselves
      const userId = req.user.claims.sub;
      if (input.userId !== userId) {
        // Force the userId to match the authenticated session
        input.userId = userId;
      }

      const score = await storage.createScore(input);
      res.status(201).json(score);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.scores.listMyScores.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const scores = await storage.getUserScores(userId);
    res.json(scores);
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingLevels = await storage.getLevels();
  if (existingLevels.length === 0) {
    console.log("Seeding database with initial levels...");
    
    // Helper to generate simple rhythm patterns
    const generateSimplePattern = (duration: number, bpm: number): GameData['tiles'] => {
      const tiles: GameData['tiles'] = [];
      const beatDuration = 60 / bpm;
      let time = 1.0; // Start after 1 second
      
      while (time < duration - 2) {
        const lane = Math.floor(Math.random() * 4) as 0|1|2|3;
        tiles.push({
          time: parseFloat(time.toFixed(2)),
          lane,
          type: Math.random() > 0.8 ? 'hold' : 'tap', // 20% chance of hold
          duration: Math.random() > 0.8 ? beatDuration : undefined
        });
        time += beatDuration; // One note per beat
      }
      return tiles;
    };

    // 1. Surah Al-Fatiha (Quran)
    await storage.createLevel({
      title: "Surah Al-Fatiha",
      subTitle: "The Opening",
      artist: "Mishary Alafasy",
      type: "quran",
      difficulty: "easy",
      audioUrl: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3",
      duration: 45,
      bpm: 80,
      gameData: {
        tiles: generateSimplePattern(45, 80),
        quiz: [
          {
            question: "What does 'Al-Rahman' mean?",
            options: ["The Most Merciful", "The King", "The Opener", "The Creator"],
            correctIndex: 0,
            explanation: "Al-Rahman is one of the names of Allah, meaning The Most Merciful."
          },
          {
            question: "How many verses are in Surah Al-Fatiha?",
            options: ["5", "7", "10", "3"],
            correctIndex: 1,
            explanation: "There are 7 verses in Surah Al-Fatiha."
          }
        ]
      }
    });

    // 2. Tala' al-Badru 'Alayna (Nasheed)
    await storage.createLevel({
      title: "Tala' al-Badru 'Alayna",
      subTitle: "Welcome O Full Moon",
      artist: "Traditional",
      type: "nasheed",
      difficulty: "medium",
      audioUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Tala_al_badru_alayna.ogg", // Placeholder
      duration: 60,
      bpm: 100,
      gameData: {
        tiles: generateSimplePattern(60, 100),
        quiz: [
          {
            question: "When was this nasheed originally sung?",
            options: ["Battle of Badr", "Hijrah to Medina", "Conquest of Mecca", "Eid al-Fitr"],
            correctIndex: 1,
            explanation: "It was sung by the Ansar to welcome Prophet Muhammad (PBUH) upon his arrival in Medina."
          }
        ]
      }
    });
    
    // 3. Arabic Alphabet (Knowledge)
    await storage.createLevel({
      title: "Arabic Alphabet",
      subTitle: "Alif Baa Taa",
      artist: "Learning",
      type: "knowledge",
      difficulty: "easy",
      audioUrl: "placeholder", 
      duration: 30,
      bpm: 60,
      gameData: {
        tiles: generateSimplePattern(30, 60).map(t => ({...t, word: "Alif"})), // Simplified
        quiz: [
          {
            question: "What is the first letter of the Arabic alphabet?",
            options: ["Baa", "Jeem", "Alif", "Daal"],
            correctIndex: 2
          }
        ]
      }
    });
  }
}
