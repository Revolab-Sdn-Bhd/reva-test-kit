import type { NextApiRequest, NextApiResponse } from "next";
import { getUser } from "@/lib/cache";

interface ReceiverInfo {
  name: string;
  mobileNumber: string;
}

interface InstructedAmount {
  amount: number;
  currency: string;
}

interface RemittanceInfo {
  purposeCode: string;
  purposeDescription: string;
}

interface RequestAnalysisRequest {
  receiverInfo: ReceiverInfo;
  instructedAmount: InstructedAmount;
  remittanceInfo: RemittanceInfo;
}

interface RequestAnalysisResult {
  receiverInfo: {
    name: string;
    mobileNumber: string;
  };
  senderInfo: {
    name: string;
    mobileNumber: string;
  };
  instructedAmount: InstructedAmount;
  chargeAmount: {
    amount: number;
    currency: string;
  };
  totalAmount: {
    amount: number;
    currency: string;
  };
  remittanceInfo: RemittanceInfo;
}

interface RequestAnalysisResponse {
  metadata: {
    queryParameters: Record<string, any>;
    pagination: {
      totalPages: number;
      totalRecords: number;
      hasNext: boolean;
    };
  };
  links: Array<{
    href: string;
    method: string;
    rel: string;
  }>;
  data: {
    results: RequestAnalysisResult[];
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    RequestAnalysisResponse | { error: string; message?: string }
  >
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      receiverInfo,
      instructedAmount,
      remittanceInfo,
    }: RequestAnalysisRequest = req.body;

    // Validate required fields
    if (!receiverInfo?.mobileNumber) {
      return res.status(400).json({
        error: "receiverInfo.mobileNumber is required",
      });
    }

    if (!instructedAmount?.amount || !instructedAmount?.currency) {
      return res.status(400).json({
        error:
          "instructedAmount.amount and instructedAmount.currency are required",
      });
    }

    if (!remittanceInfo?.purposeCode) {
      return res.status(400).json({
        error: "remittanceInfo.purposeCode is required",
      });
    }

    // Get sender info from the user (assuming single user)
    const user = getUser();
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    // Mock receiver name lookup based on mobile number
    const receiverName = generateReceiverName(receiverInfo.mobileNumber);

    // Format mobile numbers to international format
    const formattedReceiverMobile = formatMobileNumber(
      receiverInfo.mobileNumber
    );
    const formattedSenderMobile = "+962775851126"; // Mock sender mobile

    // Calculate charge and total amount (no charge for request)
    const chargeAmount = 0;
    const totalAmount = instructedAmount.amount;

    const result: RequestAnalysisResult = {
      receiverInfo: {
        name: receiverName,
        mobileNumber: formattedReceiverMobile,
      },
      senderInfo: {
        name: user.name,
        mobileNumber: formattedSenderMobile,
      },
      instructedAmount: {
        amount: instructedAmount.amount,
        currency: instructedAmount.currency,
      },
      chargeAmount: {
        amount: chargeAmount,
        currency: instructedAmount.currency,
      },
      totalAmount: {
        amount: totalAmount,
        currency: instructedAmount.currency,
      },
      remittanceInfo: {
        purposeCode: remittanceInfo.purposeCode,
        purposeDescription: remittanceInfo.purposeDescription,
      },
    };

    const response: RequestAnalysisResponse = {
      metadata: {
        queryParameters: {},
        pagination: {
          totalPages: 1,
          totalRecords: 1,
          hasNext: false,
        },
      },
      links: [
        {
          href: "/neobanking/payment-experience/v1/requests/analysis",
          method: "POST",
          rel: "self",
        },
      ],
      data: {
        results: [result],
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error analyzing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function formatMobileNumber(mobileNumber: string): string {
  // Remove leading zeros and add +962 prefix if not present
  let formatted = mobileNumber.replace(/^00/, "+");
  if (!formatted.startsWith("+")) {
    formatted = "+962" + formatted.replace(/^0+/, "");
  }
  return formatted;
}

function generateReceiverName(mobileNumber: string): string {
  // Mock name generation based on mobile number
  const names = [
    "AHMAD QADADEH",
    "Bana AlHasan",
    "MOHAMMED YOUSSEF",
    "SARA KHALIL",
    "OMAR HASSAN",
  ];
  const hash = mobileNumber
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return names[hash % names.length];
}
