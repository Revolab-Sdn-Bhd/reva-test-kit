import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { SubAccount, User } from "@/types/accounts";
import type { SavingSpace } from "@/types/savingSpaces";

// Preserve database instance across hot reloads in development
declare global {
	// eslint-disable-next-line no-var
	var dbInstance: Database.Database | undefined;
}

// Database file path - use environment variable or default to current directory
const DB_DIR = process.env.SQLITE_DB_PATH
	? path.dirname(process.env.SQLITE_DB_PATH)
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

	// Create Users table (single user for the test kit)
	db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      virtualIban TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

	// Create SubAccounts table (multiple accounts per user with different currencies)
	db.exec(`
    CREATE TABLE IF NOT EXISTS sub_accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      accountNumber TEXT NOT NULL UNIQUE,
      accountBalance REAL NOT NULL,
      currency TEXT NOT NULL,
      currencySymbol TEXT NOT NULL,
      currencyAccountName TEXT NOT NULL,
      enabledCardTransactions TEXT NOT NULL DEFAULT 'ALLOW',
      enabledAutoFund TEXT NOT NULL DEFAULT 'ENABLE',
      visibility INTEGER NOT NULL DEFAULT 1,
      orderIndex INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

	// Create SavingSpaces table (linked to sub-accounts instead of users)
	db.exec(`
    CREATE TABLE IF NOT EXISTS saving_spaces (
      savingSpaceId TEXT PRIMARY KEY,
      subAccountId TEXT NOT NULL,
      description TEXT,
			name TEXT,
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
      FOREIGN KEY (subAccountId) REFERENCES sub_accounts(id) ON DELETE CASCADE
    )
  `);

	// Create BillProfiles table
	db.exec(`
    CREATE TABLE IF NOT EXISTS bill_profiles (
      customerProviderIdentifier TEXT PRIMARY KEY,
      billingInfo TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

	// Create indexes for better query performance
	db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sub_accounts_user ON sub_accounts(userId);
    CREATE INDEX IF NOT EXISTS idx_sub_accounts_account_number ON sub_accounts(accountNumber);
    CREATE INDEX IF NOT EXISTS idx_saving_spaces_sub_account ON saving_spaces(subAccountId);
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
 * Create or get the main user (only one user in test kit)
 */
export const upsertUser = (user: {
	name: string;
	virtualIban: string;
}): User => {
	const now = new Date().toISOString();
	const id = "main-user";

	const stmt = db.prepare(`
    INSERT INTO users (id, name, virtualIban, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) 
    DO UPDATE SET 
      name = excluded.name,
      virtualIban = excluded.virtualIban,
      updatedAt = excluded.updatedAt
    RETURNING *
  `);

	const result = stmt.get(id, user.name, user.virtualIban, now, now) as any;

	return {
		id: result.id,
		name: result.name,
		virtualIban: result.virtualIban,
	};
};

/**
 * Get the main user
 */
export const getUser = (): User | null => {
	const stmt = db.prepare(`SELECT * FROM users WHERE id = 'main-user'`);
	const user = stmt.get() as any;

	if (!user) return null;

	return {
		id: user.id,
		name: user.name,
		virtualIban: user.virtualIban,
	};
};

/**
 * Create a sub-account for the user
 */
export const createSubAccount = (
	userId: string,
	account: Omit<SubAccount, "id" | "userId">,
): SubAccount => {
	const now = new Date().toISOString();
	const id = `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`;

	const stmt = db.prepare(`
    INSERT INTO sub_accounts (
      id, userId, accountNumber, accountBalance, currency,
      currencySymbol, currencyAccountName, enabledCardTransactions,
      enabledAutoFund, visibility, orderIndex, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `);

	const result = stmt.get(
		id,
		userId,
		account.accountNumber,
		account.accountBalance,
		account.currency,
		account.currencySymbol,
		account.currencyAccountName,
		account.enabledCardTransactions,
		account.enabledAutoFund,
		account.visibility ? 1 : 0,
		account.orderIndex,
		now,
		now,
	) as any;

	return mapDBToSubAccount(result);
};

/**
 * Get sub-account by ID
 */
export const getSubAccountById = (id: string): SubAccount | null => {
	const stmt = db.prepare(`SELECT * FROM sub_accounts WHERE id = ?`);
	const account = stmt.get(id) as any;

	if (!account) return null;

	const spacesStmt = db.prepare(`
    SELECT * FROM saving_spaces WHERE subAccountId = ? ORDER BY createdAt DESC
  `);
	const spaces = spacesStmt.all(id) as any[];

	return {
		...mapDBToSubAccount(account),
		savingSpaces: spaces.map(mapDBToSavingSpace),
	};
};

/**
 * Get sub-account by account number
 */
export const getSubAccountByNumber = (
	accountNumber: string,
): SubAccount | null => {
	const stmt = db.prepare(`SELECT * FROM sub_accounts WHERE accountNumber = ?`);
	const account = stmt.get(accountNumber) as any;

	if (!account) return null;

	return mapDBToSubAccount(account);
};

/**
 * Get all sub-accounts for a user
 */
export const getSubAccountsByUserId = (userId: string): SubAccount[] => {
	const stmt = db.prepare(`
    SELECT * FROM sub_accounts WHERE userId = ? ORDER BY orderIndex ASC, createdAt DESC
  `);
	const accounts = stmt.all(userId) as any[];

	return accounts.map((account) => {
		const spacesStmt = db.prepare(`
      SELECT * FROM saving_spaces WHERE subAccountId = ? ORDER BY createdAt DESC
    `);
		const spaces = spacesStmt.all(account.id) as any[];

		return {
			...mapDBToSubAccount(account),
			savingSpaces: spaces.map(mapDBToSavingSpace),
		};
	});
};

/**
 * Get all sub-accounts
 */
export const getAllSubAccounts = (): SubAccount[] => {
	const stmt = db.prepare(`
    SELECT * FROM sub_accounts ORDER BY orderIndex ASC, createdAt DESC
  `);
	const accounts = stmt.all() as any[];

	return accounts.map((account) => {
		const spacesStmt = db.prepare(`
      SELECT * FROM saving_spaces WHERE subAccountId = ? ORDER BY createdAt DESC
    `);
		const spaces = spacesStmt.all(account.id) as any[];

		return {
			...mapDBToSubAccount(account),
			savingSpaces: spaces.map(mapDBToSavingSpace),
		};
	});
};

/**
 * Update sub-account balance
 */
export const updateSubAccountBalance = (
	subAccountId: string,
	amount: number,
	operation: "deposit" | "withdrawal",
): boolean => {
	const stmt = db.prepare(`
    UPDATE sub_accounts 
    SET accountBalance = accountBalance ${operation === "deposit" ? "+" : "-"} ?,
        updatedAt = ?
    WHERE id = ?
  `);
	const result = stmt.run(amount, new Date().toISOString(), subAccountId);
	return result.changes > 0;
};

/**
 * Delete user (will cascade delete all sub-accounts and saving spaces)
 */
export const deleteUser = (): boolean => {
	const stmt = db.prepare(`DELETE FROM users WHERE id = 'main-user'`);
	const result = stmt.run();
	return result.changes > 0;
};

/**
 * Delete sub-account (will cascade delete saving spaces)
 * If deleting primary account (orderIndex = 0), also delete the user
 */
export const deleteSubAccount = (subAccountId: string): boolean => {
	// Check if this is the primary account
	const checkStmt = db.prepare(
		`SELECT orderIndex FROM sub_accounts WHERE id = ?`,
	);
	const account = checkStmt.get(subAccountId) as
		| { orderIndex: number }
		| undefined;

	if (account && account.orderIndex === 0) {
		// Primary account - delete the entire user (cascades to all sub-accounts)
		return deleteUser();
	}

	// Regular sub-account - just delete it
	const stmt = db.prepare(`DELETE FROM sub_accounts WHERE id = ?`);
	const result = stmt.run(subAccountId);
	return result.changes > 0;
};

/**
 * Create saving space for a sub-account
 */
export const createSavingSpace = (
	subAccountId: string,
	space: SavingSpace,
): SavingSpace => {
	const now = new Date().toISOString();

	const stmt = db.prepare(`
    INSERT INTO saving_spaces (
      savingSpaceId, subAccountId, description, categoryName, frequency,
      targetAmount, remainingPercentage, categoryPictureUrl, targetDate,
      remainingAmount, apiInteractionId, savedPercentage, savedAmount,
      partyId, startDate, categoryPictureId, status, currency, createdAt, name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

	stmt.run(
		space.savingSpaceId,
		subAccountId,
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
		now,
		space.name,
	);

	return space;
};

/**
 * Get saving space by ID
 */
export const getSavingSpaceById = (
	savingSpaceId: string,
): (SavingSpace & { subAccountId: string }) | null => {
	const stmt = db.prepare(`
    SELECT ss.*, sa.accountNumber, u.name
    FROM saving_spaces ss
    JOIN sub_accounts sa ON ss.subAccountId = sa.id
    JOIN users u ON sa.userId = u.id
    WHERE ss.savingSpaceId = ?
  `);
	const row = stmt.get(savingSpaceId) as any;

	if (!row) return null;

	const space = mapDBToSavingSpace(row);
	return {
		...space,
		name: row.name,
		accountNumber: row.accountNumber,
		subAccountId: row.subAccountId,
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
	remainingPercentage: number,
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
		savingSpaceId,
	);
	return result.changes > 0;
};

/**
 * Map database row to SubAccount object
 */
const mapDBToSubAccount = (row: any): SubAccount => {
	return {
		id: row.id,
		userId: row.userId,
		accountNumber: row.accountNumber,
		accountBalance: row.accountBalance,
		currency: row.currency,
		currencySymbol: row.currencySymbol,
		currencyAccountName: row.currencyAccountName,
		enabledCardTransactions: row.enabledCardTransactions,
		enabledAutoFund: row.enabledAutoFund,
		visibility: row.visibility === 1,
		orderIndex: row.orderIndex,
	};
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
		name: row.name, // Will be filled from user data
		status: row.status,
	};
};

// ============= Bill Profiles Functions =============

export interface BillingInfo {
	status: string;
	billerName: string;
	paymentType: string;
	serviceType: string;
	iconLink: string;
	billerCode: string;
	customerIdentifier: string;
	nickName: string;
}

export interface BillProfile {
	billingInfo: BillingInfo[];
	customerProviderIdentifier: string;
}

/**
 * Get all bill profiles
 */
export const getAllBillProfiles = (): BillProfile[] => {
	const db = getDB();
	const rows = db
		.prepare("SELECT * FROM bill_profiles ORDER BY createdAt DESC")
		.all();

	return rows.map((row: any) => ({
		customerProviderIdentifier: row.customerProviderIdentifier,
		billingInfo: JSON.parse(row.billingInfo),
	}));
};

/**
 * Get bill profile by customer provider identifier
 */
export const getBillProfileById = (
	customerProviderIdentifier: string,
): BillProfile | null => {
	const db = getDB();
	const row = db
		.prepare("SELECT * FROM bill_profiles WHERE customerProviderIdentifier = ?")
		.get(customerProviderIdentifier);

	if (!row) return null;

	return {
		customerProviderIdentifier: (row as any).customerProviderIdentifier,
		billingInfo: JSON.parse((row as any).billingInfo),
	};
};

/**
 * Create a new bill profile
 */
export const createBillProfile = (billProfile: BillProfile): void => {
	const db = getDB();
	const now = new Date().toISOString();

	db.prepare(
		`
    INSERT INTO bill_profiles (customerProviderIdentifier, billingInfo, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `,
	).run(
		billProfile.customerProviderIdentifier,
		JSON.stringify(billProfile.billingInfo),
		now,
		now,
	);
};

/**
 * Update an existing bill profile
 */
export const updateBillProfile = (billProfile: BillProfile): void => {
	const db = getDB();
	const now = new Date().toISOString();

	db.prepare(
		`
    UPDATE bill_profiles
    SET billingInfo = ?, updatedAt = ?
    WHERE customerProviderIdentifier = ?
  `,
	).run(
		JSON.stringify(billProfile.billingInfo),
		now,
		billProfile.customerProviderIdentifier,
	);
};

/**
 * Delete a bill profile
 */
export const deleteBillProfile = (customerProviderIdentifier: string): void => {
	const db = getDB();
	db.prepare(
		"DELETE FROM bill_profiles WHERE customerProviderIdentifier = ?",
	).run(customerProviderIdentifier);
};
