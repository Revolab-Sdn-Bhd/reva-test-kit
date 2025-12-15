// Account-related types
export interface Amount {
	amount: number;
	currency: string;
}

// Main user structure (single user in test kit)
export interface User {
	id: string;
	name: string;
	virtualIban: string;
}

// Sub-account structure (one user has multiple sub-accounts with different currencies)
export interface SubAccount {
	id: string;
	userId: string;
	accountNumber: string;
	accountBalance: number;
	currency: string;
	currencySymbol: string;
	currencyAccountName: string;
	enabledCardTransactions: string;
	enabledAutoFund: string;
	visibility: boolean;
	orderIndex: number;
	savingSpaces?: any[]; // Will contain saving spaces linked to this sub-account
}

export interface PrimaryAccount {
	totalBalance: Amount;
	currencyFlag: string;
	totalOutstandingBalance: Amount;
	name: string;
	virtualIban: string;
}

export interface SubAccountResponse {
	enabledCardTransactions: string;
	totalOutstandingBalance: Amount;
	accountNumber: string;
	currencyFlag: string;
	enabledAutoFund: string;
	currencySymbol: string;
	currencyAccountName: string;
	visibility: boolean;
	order: number;
	totalBalance: Amount;
	name: string;
	virtualIban: string;
}

export interface AccountDashboardData {
	primaryAccount: PrimaryAccount;
	subAccounts: SubAccountResponse[];
}

export interface AccountDashboardResponse {
	metadata: {
		queryParameters: Record<string, string>;
	};
	links: Array<{
		rel: string;
		href: string;
		method: string;
	}>;
	data: AccountDashboardData;
}

// Form data types
export interface SubAccountFormInput {
	accountNumber: string;
	accountBalance: number;
	currency: string;
	currencySymbol: string;
	currencyAccountName: string;
	enabledCardTransactions: string;
	enabledAutoFund: string;
	visibility: boolean;
	orderIndex: number;
}

export interface UserAccountCreationRequest {
	user: {
		name: string;
		virtualIban: string;
	};
	primaryAccount: SubAccountFormInput;
	subAccounts: SubAccountFormInput[];
}
