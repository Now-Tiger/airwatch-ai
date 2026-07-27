// lib/apis.ts latest
import {
  ApiResponse,
  ComplaintPayload,
  ComplaintResponseData,
  Ticket,
  EscalationMatrixRule,
  AnalyticsApiResponse,
} from "@/lib/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Escalation Matrix fallback matching DB seed
const ESCALATION_MATRIX: EscalationMatrixRule[] = [
  {
    category: "Industrial Emission",
    tier: 1,
    officer_name: "Field Inspector - Zone A",
    officer_contact: "+91-9000000001",
  },
  {
    category: "Industrial Emission",
    tier: 2,
    officer_name: "Regional Supervisor",
    officer_contact: "+91-9000000002",
  },
  {
    category: "Industrial Emission",
    tier: 3,
    officer_name: "DPCC Divisional Head",
    officer_contact: "+91-9000000003",
  },
  {
    category: "Dust CD",
    tier: 1,
    officer_name: "Field Inspector - Zone B",
    officer_contact: "+91-9000000011",
  },
  {
    category: "Dust CD",
    tier: 2,
    officer_name: "Regional Supervisor",
    officer_contact: "+91-9000000002",
  },
];

// Update the function signature to accept the structured payload object
export async function submitComplaintApi(
  payload: ComplaintPayload,
): Promise<ApiResponse<ComplaintResponseData>> {
  try {
    const response = await fetch(`${BASE_URL}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      // Directly stringify the dynamic payload object passed from the UI
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch {
    // Fallback simulation for offline frontend review
    // We dynamically pull from the payload so the simulated fallback reflects user input
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        category: "Industrial Emission",
        sub_category: null,
        priority_score: 90,
        priority_tier: "P1",
        is_urgent: true,
        sentiment_label: "distressed",
        entities: {
          pollution_source: "factory",
          // Dynamically reflect the user's input location in the fallback
          landmark: payload.location.area || "Anand Vihar",
          time_reference: null,
          quantities: [],
        },
        ai_source: "llm",
        processing_status: "processed_llm",
        is_duplicate: true,
        parent_complaint_id: "79d7b83c-bf54-4ffa-8777-50d510778b5c",
        corroboration_count: 2,
        ticket_id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      },
      error: null,
    };
  }
}

export async function fetchTicketsApi(): Promise<ApiResponse<Ticket[]>> {
  try {
    const response = await fetch(`${BASE_URL}/tickets`, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch {
    // Fallback data
    const now = new Date();
    const deadline = new Date(now.getTime() + 15 * 60000).toISOString();
    return {
      success: true,
      data: [
        {
          id: "55bf1038-d59b-408d-9378-4fd6bfcac7e7",
          complaint_id: "79d7b83c-bf54-4ffa-8777-50d510778b5c",
          status: "Open",
          priority_tier: "P1",
          category: "Industrial Emission",
          current_tier: 1,
          assigned_officer_name: "Field Inspector - Zone A",
          assigned_officer_contact: "+91-9000000001",
          sla_deadline: deadline,
          created_at: now.toISOString(),
        },
        {
          id: "77cdbffd-62fa-4da4-814b-7eac8b0f707c",
          complaint_id: "c23134d9-3f9d-4694-9bdf-f8942137df97",
          status: "In Progress",
          priority_tier: "P1",
          category: "Industrial Emission",
          current_tier: 1,
          assigned_officer_name: "Field Inspector - Zone A",
          assigned_officer_contact: "+91-9000000001",
          sla_deadline: new Date(now.getTime() - 5 * 60000).toISOString(), // Breached!
          created_at: new Date(now.getTime() - 65 * 60000).toISOString(),
        },
      ],
      error: null,
    };
  }
}

export async function escalateTicketApi(
  id: string,
): Promise<ApiResponse<Ticket>> {
  try {
    const response = await fetch(`${BASE_URL}/tickets/${id}/escalate`, {
      method: "POST",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network error");
    }

    return await response.json();
  } catch {
    // Mock fallback
    return {
      success: true,
      data: {
        id,
        complaint_id: "79d7b83c-bf54-4ffa-8777-50d510778b5c",
        status: "Escalated",
        priority_tier: "P1",
        category: "Industrial Emission",
        current_tier: 2,
        assigned_officer_name: "Regional Supervisor",
        assigned_officer_contact: "+91-9000000002",
        sla_deadline: new Date(Date.now() + 30 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

export async function updateTicketStatusApi(
  id: string,
  status: string,
): Promise<ApiResponse<Ticket>> {
  try {
    const response = await fetch(`${BASE_URL}/tickets/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ status, actor: "admin" }),
    });
    if (!response.ok) throw new Error("Network error");
    return await response.json();
  } catch {
    return {
      success: true,
      data: {
        id,
        complaint_id: "79d7b83c-bf54-4ffa-8777-50d510778b5c",
        status,
        priority_tier: "P1",
        category: "Industrial Emission",
        current_tier: 1,
        assigned_officer_name: "Field Inspector - Zone A",
        assigned_officer_contact: "+91-9000000001",
        sla_deadline: new Date(Date.now() + 30 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

export async function fetchHotspotsApi(
  timeWindow: string = "24h",
): Promise<AnalyticsApiResponse> {
  // 1. Map UI time window strings to the integer 'hours_back' parameter expected by the backend
  const hoursMap: Record<string, number> = {
    "12h": 12,
    "24h": 24,
    "7d": 168, // 7 days * 24 hours
    "30d": 720, // 30 days * 24 hours
  };

  // Default to 24 hours if timeWindow is undefined or unrecognized
  const hoursBack = hoursMap[timeWindow] ?? 24;

  try {
    // 2. Use BASE_URL, the correct /analytics/ path, and the 'hours_back' query param
    const response = await fetch(
      `${BASE_URL}/analytics/hotspots?hours_back=${hoursBack}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
    );

    // 3. Prevent HTML/JSON syntax errors by verifying HTTP status before parsing
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch hotspot analytics:", error);
    // Re-throw the error so your component's try/catch block can handle the loading state properly
    throw error;
  }
}

// Helper to simulate time travel and trigger SLA matrix escalation
export function simulateSlaEscalation(
  tickets: Ticket[],
  advanceMinutes: number,
): Ticket[] {
  const now = Date.now();
  return tickets.map((ticket) => {
    const deadlineTime =
      new Date(ticket.sla_deadline).getTime() - advanceMinutes * 60000;
    const isBreached = deadlineTime < now;

    if (isBreached && ticket.current_tier < 3 && ticket.status !== "Closed") {
      const nextTier = ticket.current_tier + 1;
      const rule =
        ESCALATION_MATRIX.find(
          (r) =>
            r.category
              .toLowerCase()
              .includes(ticket.category.toLowerCase().split(" ")[0]) &&
            r.tier === nextTier,
        ) || ESCALATION_MATRIX.find((r) => r.tier === nextTier);

      return {
        ...ticket,
        current_tier: nextTier,
        status: "Escalated",
        assigned_officer_name: rule
          ? rule.officer_name
          : `Tier ${nextTier} Officer`,
        assigned_officer_contact: rule
          ? rule.officer_contact
          : "+91-9000000099",
        sla_deadline: new Date(now - 1000).toISOString(), // Mark breached
      };
    }
    return ticket;
  });
}
