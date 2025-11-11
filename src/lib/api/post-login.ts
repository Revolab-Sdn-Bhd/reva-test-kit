export const generateIntrospectToken = async (
	chatUrl: string,
	token: string,
): Promise<string> => {
	const response = await fetch(`${chatUrl}/test/v1/auth/introspect`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	});

	const { jwt } = await response.json();
	return jwt;
};

export interface ChatSession {
	id: string;
	sessionId: string;
	rating: number | null;
	title: string;
	startDate: string;
}

interface PaginatedChatSessionResponse {
	status: string;
	code: number;
	message: string;
	data: ChatSession[];
}

export const getPaginatedChatSessions = async (
	chatUrl: string,
	introspectToken: string,
): Promise<PaginatedChatSessionResponse> => {
	const response = await fetch(
		`${chatUrl}/api/v1/user/get-paginated-chat-sessions`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${introspectToken}`,
			},
		},
	);

	const data = await response.json();
	return data;
};

export interface ChatHistory {
	id: string;
	chatId: string;
	role: "from" | "to";
	message: string;
	timestamp: string;
	isHelpful: boolean | null;
}
interface ChatHistoryResponse {
	status: string;
	code: number;
	message: string;
	data: ChatHistory[];
}

export const getChatHistory = async (
	chatUrl: string,
	introspectToken: string,
	sessionId: string,
): Promise<ChatHistoryResponse> => {
	const response = await fetch(
		`${chatUrl}/api/v1/user/get-paginated-chat-history/${sessionId}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${introspectToken}`,
			},
		},
	);

	const data = await response.json();
	return data;
};
