export interface Amount {
	currency: string;
	amount: number;
}

export interface SavingsStatusLifecycle {
	status: string;
	statusChangeDate: string;
	description: string;
}

export interface SavingSpace {
	description: string;
	categoryName: string;
	frequency: string;
	targetAmount: Amount;
	remainingPercentage: number;
	categoryPictureUrl: string;
	accountNumber: string;
	targetDate: string;
	remainingAmount: Amount;
	savingSpaceId: string;
	apiInteractionId: string;
	savedPercentage: number;
	savedAmount: Amount;
	savingsStatusLifeCycles: SavingsStatusLifecycle[];
	partyId: string;
	startDate: string;
	categoryPictureId: string;
	name: string;
	status: string;
}

export interface Pagination {
	hasNext: boolean;
	totalPages: number;
	totalRecords: number;
}

export interface QueryParameters {
	size: string;
	page: string;
}

export interface Metadata {
	queryParameters: QueryParameters;
	pagination: Pagination;
}

export interface Link {
	rel: string;
	href: string;
	method: string;
}

export interface SavingSpacesResponse {
	metadata: Metadata;
	data: {
		results: SavingSpace[];
	};
	links: Link[];
}

export interface SavingSpaceFormData {
	name: string;
	accountNumber: string;
	accountBalance: number;
	categoryName: string;
	frequency: string;
	targetAmount: number;
	savedAmount: number;
	targetDate: string;
	startDate: string;
	status: string;
	categoryPictureUrl: string;
	currency: string;
	description: string;
	partyId: string;
}

export interface SavingSpaceItem {
	name: string;
	categoryName: string;
	frequency: string;
	targetAmount: number;
	savedAmount: number;
	targetDate: string;
	startDate: string;
	status: string;
	description: string;
	categoryPictureUrl: string;
}

export interface UserSavingSpacesFormData {
	userData: {
		name: string;
		accountNumber: string;
		accountBalance: number;
		currency: string;
	};
	savingSpaces: SavingSpaceItem[];
}

export interface UserAccount {
	id: string;
	name: string;
	accountNumber: string;
	accountBalance: number;
	currency: string;
	savingSpaces: SavingSpace[];
}
