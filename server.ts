import express from "express";
import path from "path";
import fs from "fs";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const isProduction = process.env.NODE_ENV === "production" || 
  (typeof __filename !== "undefined" && __filename.endsWith(".cjs")) || 
  !fs.existsSync(path.join(process.cwd(), "server.ts"));

// Define types
interface User {
  id: string;
  email: string;
  passwordHash: string; // Storing plain text or simple hash since this is a demo applet
  isAdmin: boolean;
  coins: number;
  boosterUntil: number | null; // Timestamp in milliseconds
  createdAt: string;
}

interface RedeemRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number; // in INR (10, 20, 50, 100)
  coinsRequired: number; // 2500, 4000, 10000, 19500
  paymentDetails: string; // e.g. "Paytm: 9876543210" or "Email: abc@gmail.com"
  status: "pending" | "completed" | "rejected";
  redeemCode?: string; // Code provided by admin
  createdAt: string;
  processedAt?: string;
}

interface DatabaseSchema {
  users: Record<string, User>; // Key: email
  requests: RedeemRequest[];
}

// Initialize database
function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data) as DatabaseSchema;
      // Ensure admin exists
      if (!parsed.users["admin@gmail.com"]) {
        parsed.users["admin@gmail.com"] = {
          id: "admin-id",
          email: "admin@gmail.com",
          passwordHash: "admin124",
          isAdmin: true,
          coins: 0,
          boosterUntil: null,
          createdAt: new Date().toISOString(),
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
      return parsed;
    }
  } catch (error) {
    console.error("Error reading database, resetting...", error);
  }

  const initialDb: DatabaseSchema = {
    users: {
      "admin@gmail.com": {
        id: "admin-id",
        email: "admin@gmail.com",
        passwordHash: "admin124",
        isAdmin: true,
        coins: 0,
        boosterUntil: null,
        createdAt: new Date().toISOString(),
      },
    },
    requests: [],
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper authentication middleware
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    const email = authHeader.split(" ")[1];
    const db = loadDb();
    const user = db.users[email];
    if (!user) {
      res.status(401).json({ error: "User not found or session invalid" });
      return;
    }
    (req as any).user = user;
    next();
  };

  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    const email = authHeader.split(" ")[1];
    const db = loadDb();
    const user = db.users[email];
    if (!user || !user.isAdmin) {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    (req as any).user = user;
    next();
  };

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === "admin@gmail.com") {
      res.status(400).json({ error: "Cannot register as admin" });
      return;
    }

    const db = loadDb();
    if (db.users[normalizedEmail]) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      passwordHash: password, // Store password directly for simple implementation
      isAdmin: false,
      coins: 0,
      boosterUntil: null,
      createdAt: new Date().toISOString(),
    };

    db.users[normalizedEmail] = newUser;
    saveDb(db);

    res.json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        coins: newUser.coins,
        boosterUntil: newUser.boosterUntil,
      },
    });
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = loadDb();
    const user = db.users[normalizedEmail];

    if (!user || user.passwordHash !== password) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    res.json({
      message: "Login successful",
      token: user.email, // Simple token implementation
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        coins: user.coins,
        boosterUntil: user.boosterUntil,
      },
    });
  });

  // User Profile
  app.get("/api/user/profile", authenticateUser, (req: any, res) => {
    const user = req.user as User;
    const db = loadDb();
    // Load fresh copy of user and user's requests
    const freshUser = db.users[user.email];
    const userRequests = db.requests.filter((r) => r.userId === user.id);

    // Calculate booster status
    const now = Date.now();
    const isBoosterActive = freshUser.boosterUntil ? freshUser.boosterUntil > now : false;
    const boosterTimeRemaining = isBoosterActive ? Math.max(0, (freshUser.boosterUntil || 0) - now) : 0;

    res.json({
      user: {
        id: freshUser.id,
        email: freshUser.email,
        isAdmin: freshUser.isAdmin,
        coins: freshUser.coins,
        boosterUntil: freshUser.boosterUntil,
        isBoosterActive,
        boosterTimeRemaining,
      },
      requests: userRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  });

  // Earn Coins by Watching Ad
  app.post("/api/user/earn-coins", authenticateUser, (req: any, res) => {
    const user = req.user as User;
    const db = loadDb();
    const freshUser = db.users[user.email];

    // Determine if booster is active
    const now = Date.now();
    const isBoosterActive = freshUser.boosterUntil ? freshUser.boosterUntil > now : false;

    const baseCoins = 10;
    const earnedCoins = isBoosterActive ? baseCoins * 2 : baseCoins;

    freshUser.coins += earnedCoins;
    saveDb(db);

    res.json({
      success: true,
      earned: earnedCoins,
      boosterActive: isBoosterActive,
      newCoins: freshUser.coins,
    });
  });

  // Watch Booster Ad to activate 2x booster
  app.post("/api/user/watch-booster-ad", authenticateUser, (req: any, res) => {
    const user = req.user as User;
    const db = loadDb();
    const freshUser = db.users[user.email];

    // Activate booster for 15 minutes (15 * 60 * 1000 = 900000ms)
    const BOOSTER_DURATION_MS = 15 * 60 * 1000;
    const now = Date.now();

    // Extend current booster or set fresh one
    const currentBoosterUntil = freshUser.boosterUntil && freshUser.boosterUntil > now ? freshUser.boosterUntil : now;
    freshUser.boosterUntil = currentBoosterUntil + BOOSTER_DURATION_MS;

    saveDb(db);

    res.json({
      success: true,
      boosterUntil: freshUser.boosterUntil,
      message: "2x Coin Booster activated successfully for 15 minutes!",
    });
  });

  // Request Redeem Code
  app.post("/api/user/redeem", authenticateUser, (req: any, res) => {
    const user = req.user as User;
    const { amount, paymentDetails } = req.body;

    if (!amount || !paymentDetails) {
      res.status(400).json({ error: "Amount and payment details are required" });
      return;
    }

    const validPackages: Record<number, number> = {
      10: 2500,
      20: 4000,
      50: 10000,
      100: 19500,
    };

    const coinsRequired = validPackages[Number(amount)];
    if (!coinsRequired) {
      res.status(400).json({ error: "Invalid redeem amount package" });
      return;
    }

    const db = loadDb();
    const freshUser = db.users[user.email];

    if (freshUser.coins < coinsRequired) {
      res.status(400).json({ error: `Insufficient coins. You need ${coinsRequired} coins.` });
      return;
    }

    // Deduct coins
    freshUser.coins -= coinsRequired;

    // Create request
    const newRequest: RedeemRequest = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: freshUser.id,
      userEmail: freshUser.email,
      amount: Number(amount),
      coinsRequired,
      paymentDetails,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    db.requests.push(newRequest);
    saveDb(db);

    res.json({
      success: true,
      newCoins: freshUser.coins,
      request: newRequest,
    });
  });

  // Admin: Get all redeem requests
  app.get("/api/admin/requests", authenticateAdmin, (req, res) => {
    const db = loadDb();
    res.json({
      requests: db.requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  });

  // Admin: Process Payout
  app.post("/api/admin/payout", authenticateAdmin, (req, res) => {
    const { requestId, status, redeemCode } = req.body;

    if (!requestId || !status) {
      res.status(400).json({ error: "Request ID and status are required" });
      return;
    }

    if (status === "completed" && !redeemCode) {
      res.status(400).json({ error: "Redeem code is required for successful payout" });
      return;
    }

    const db = loadDb();
    const requestIndex = db.requests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      res.status(404).json({ error: "Redeem request not found" });
      return;
    }

    const request = db.requests[requestIndex];
    if (request.status !== "pending") {
      res.status(400).json({ error: "Request has already been processed" });
      return;
    }

    request.status = status;
    request.processedAt = new Date().toISOString();
    if (status === "completed") {
      request.redeemCode = redeemCode;
    } else if (status === "rejected") {
      // Refund the coins to the user
      const user = Object.values(db.users).find((u) => u.id === request.userId);
      if (user) {
        user.coins += request.coinsRequired;
      }
    }

    saveDb(db);

    res.json({
      success: true,
      request,
    });
  });

  // Admin: Get all users
  app.get("/api/admin/users", authenticateAdmin, (req, res) => {
    const db = loadDb();
    const userList = Object.values(db.users).map((u) => ({
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      coins: u.coins,
      boosterUntil: u.boosterUntil,
      createdAt: u.createdAt,
    }));

    res.json({ users: userList });
  });

  // Admin: Add or adjust user coins directly
  app.post("/api/admin/adjust-coins", authenticateAdmin, (req, res) => {
    const { userEmail, adjustmentAmount } = req.body;
    if (!userEmail || adjustmentAmount === undefined) {
      res.status(400).json({ error: "User email and adjustment amount are required" });
      return;
    }

    const db = loadDb();
    const freshUser = db.users[userEmail.toLowerCase().trim()];
    if (!freshUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    freshUser.coins = Math.max(0, freshUser.coins + Number(adjustmentAmount));
    saveDb(db);

    res.json({
      success: true,
      email: freshUser.email,
      newCoins: freshUser.coins,
    });
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
