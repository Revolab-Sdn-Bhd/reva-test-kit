import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { SavingSpace, UserAccount } from "@/types/savingSpaces";

// Preserve database instance across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var dbInstance: Database.Database | undefined;
}

// Database file path - use environment variable or default to current directory
const DB_DIR =
  process.env.SQLITE_DB_PATH ?
    path.dirname(process.env.SQLITE_DB_PATH)
  : process.cwd();
const DB_PATH =
  process.env.SQLITE_DB_PATH || path.join(process.cwd(), "cache.db");

// Initialize database
const initDB = (): Database.Database => {
  // Ensure directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      accountNumber TEXT NOT NULL,
      accountBalance REAL NOT NULL,
      currency TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(name, accountNumber)
    )
  `);

  // Create SavingSpaces table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saving_spaces (
      savingSpaceId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      description TEXT,
      categoryName TEXT NOT NULL,
      frequency TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      remainingPercentage REAL NOT NULL,
      categoryPictureUrl TEXT,
      targetDate TEXT NOT NULL,
      remainingAmount REAL NOT NULL,
      apiInteractionId TEXT NOT NULL,
      savedPercentage REAL NOT NULL,
      savedAmount REAL NOT NULL,
      partyId TEXT,
      startDate TEXT NOT NULL,
      categoryPictureId TEXT NOT NULL,
      status TEXT NOT NULL,
      currency TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_account ON users(name, accountNumber);
    CREATE INDEX IF NOT EXISTS idx_saving_spaces_user ON saving_spaces(userId);
  `);

  return db;
};

// Get or create database instance
const getDB = (): Database.Database => {
  if (process.env.NODE_ENV === "development" && global.dbInstance) {
    return global.dbInstance;
  }

  const db = initDB();

  if (process.env.NODE_ENV === "development") {
    global.dbInstance = db;
  }

  return db;
};

export const db = getDB();

// Database operations

/**
 * Create or update a user account
 */
export const upsertUser = (
  user: Omit<UserAccount, "savingSpaces">
): UserAccount => {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, name, accountNumber, accountBalance, currency, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name, accountNumber) 
    DO UPDATE SET 
      accountBalance = excluded.accountBalance,
      currency = excluded.currency,
      updatedAt = excluded.updatedAt
    RETURNING *
  `);

  const result = stmt.get(
    user.id,
    user.name,
    user.accountNumber,
    user.accountBalance,
    user.currency,
    now,
    now
  ) as any;

  return {
    id: result.id,
    name: result.name,
    accountNumber: result.accountNumber,
    accountBalance: result.accountBalance,
    currency: result.currency,
    savingSpaces: [],
  };
};

/**
 * Get user by name and account number
 */
export const getUserByAccount = (
  name: string,
  accountNumber: string
): UserAccount | null => {
  const userStmt = db.prepare(`
    SELECT * FROM users WHERE name = ? AND accountNumber = ?
  `);
  const user = userStmt.get(name, accountNumber) as any;

  if (!user) return null;

  const spacesStmt = db.prepare(`
    SELECT * FROM saving_spaces WHERE userId = ?
  `);
  const spaces = spacesStmt.all(user.id) as any[];

  return {
    id: user.id,
    name: user.name,
    accountNumber: user.accountNumber,
    accountBalance: user.accountBalance,
    currency: user.currency,
    savingSpaces: spaces.map(mapDBToSavingSpace),
  };
};

/**
 * Get user by ID
 */
export const getUserById = (id: string): UserAccount | null => {
  const userStmt = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `);
  const user = userStmt.get(id) as any;

  if (!user) return null;

  const spacesStmt = db.prepare(`
    SELECT * FROM saving_spaces WHERE userId = ?
  `);
  const spaces = spacesStmt.all(user.id) as any[];

  return {
    id: user.id,
    name: user.name,
    accountNumber: user.accountNumber,
    accountBalance: user.accountBalance,
    currency: user.currency,
    savingSpaces: spaces.map(mapDBToSavingSpace),
  };
};

/**
 * Get all users with their saving spaces
 */
export const getAllUsers = (): UserAccount[] => {
  const usersStmt = db.prepare(`SELECT * FROM users ORDER BY createdAt DESC`);
  const users = usersStmt.all() as any[];

  return users.map((user) => {
    const spacesStmt = db.prepare(`
      SELECT * FROM saving_spaces WHERE userId = ? ORDER BY createdAt DESC
    `);
    const spaces = spacesStmt.all(user.id) as any[];

    return {
      id: user.id,
      name: user.name,
      accountNumber: user.accountNumber,
      accountBalance: user.accountBalance,
      currency: user.currency,
      savingSpaces: spaces.map(mapDBToSavingSpace),
    };
  });
};

/**
 * Create saving space for a user
 */
export const createSavingSpace = (
  userId: string,
  space: SavingSpace
): SavingSpace => {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO saving_spaces (
      savingSpaceId, userId, description, categoryName, frequency,
      targetAmount, remainingPercentage, categoryPictureUrl, targetDate,
      remainingAmount, apiInteractionId, savedPercentage, savedAmount,
      partyId, startDate, categoryPictureId, status, currency, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    space.savingSpaceId,
    userId,
    space.description,
    space.categoryName,
    space.frequency,
    space.targetAmount.amount,
    space.remainingPercentage,
    space.categoryPictureUrl,
    space.targetDate,
    space.remainingAmount.amount,
    space.apiInteractionId,
    space.savedPercentage,
    space.savedAmount.amount,
    space.partyId,
    space.startDate,
    space.categoryPictureId,
    space.status,
    space.targetAmount.currency,
    now
  );

  return space;
};

/**
 * Get saving space by ID
 */
export const getSavingSpaceById = (
  savingSpaceId: string
): (SavingSpace & { userId: string }) | null => {
  const stmt = db.prepare(`
    SELECT ss.*, u.name, u.accountNumber 
    FROM saving_spaces ss
    JOIN users u ON ss.userId = u.id
    WHERE ss.savingSpaceId = ?
  `);
  const row = stmt.get(savingSpaceId) as any;

  if (!row) return null;

  const space = mapDBToSavingSpace(row);
  return {
    ...space,
    name: row.name,
    accountNumber: row.accountNumber,
    userId: row.userId,
  };
};

/**
 * Update saving space amounts (for deposits/withdrawals)
 */
export const updateSavingSpaceAmounts = (
  savingSpaceId: string,
  savedAmount: number,
  remainingAmount: number,
  savedPercentage: number,
  remainingPercentage: number
): boolean => {
  const stmt = db.prepare(`
    UPDATE saving_spaces 
    SET savedAmount = ?,
        remainingAmount = ?,
        savedPercentage = ?,
        remainingPercentage = ?
    WHERE savingSpaceId = ?
  `);
  const result = stmt.run(
    savedAmount,
    remainingAmount,
    savedPercentage,
    remainingPercentage,
    savingSpaceId
  );
  return result.changes > 0;
};

/**
 * Update user account balance
 */
export const updateUserAccountBalance = (
  userId: string,
  amount: number,
  operation: "deposit" | "withdrawal"
): boolean => {
  const stmt = db.prepare(`
    UPDATE users 
    SET accountBalance = accountBalance ${operation === "deposit" ? "+" : "-"} ?,
        updatedAt = ?
    WHERE id = ?
  `);
  const result = stmt.run(amount, new Date().toISOString(), userId);
  return result.changes > 0;
};

/**
 * Delete user account and all associated saving spaces
 */
export const deleteUser = (userId: string): boolean => {
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  const result = stmt.run(userId);
  return result.changes > 0;
};

/**
 * Delete user by name and account number
 */
export const deleteUserByAccount = (
  name: string,
  accountNumber: string
): boolean => {
  const stmt = db.prepare(
    `DELETE FROM users WHERE name = ? AND accountNumber = ?`
  );
  const result = stmt.run(name, accountNumber);
  return result.changes > 0;
};

/**
 * Map database row to SavingSpace object
 */
const mapDBToSavingSpace = (row: any): SavingSpace => {
  return {
    savingSpaceId: row.savingSpaceId,
    description: row.description || "",
    categoryName: row.categoryName,
    frequency: row.frequency,
    targetAmount: {
      currency: row.currency,
      amount: row.targetAmount,
    },
    remainingPercentage: row.remainingPercentage,
    categoryPictureUrl: row.categoryPictureUrl || "",
    accountNumber: "", // Will be filled from user data
    targetDate: row.targetDate,
    remainingAmount: {
      currency: row.currency,
      amount: row.remainingAmount,
    },
    apiInteractionId: row.apiInteractionId,
    savedPercentage: row.savedPercentage,
    savedAmount: {
      currency: row.currency,
      amount: row.savedAmount,
    },
    savingsStatusLifeCycles: [
      {
        status: row.status,
        statusChangeDate: row.createdAt,
        description: "CREATED",
      },
    ],
    partyId: row.partyId || "",
    startDate: row.startDate,
    categoryPictureId: row.categoryPictureId,
    name: "", // Will be filled from user data
    status: row.status,
  };
};
