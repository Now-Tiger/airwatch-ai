// lib/apis.ts latest
import { 
  ApiResponse, 
  ComplaintPayload,
  ComplaintResponseData, 
  Ticket, 
  HotspotResponseData,
  EscalationMatrixRule 
} from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

// Escalation Matrix fallback matching DB seed
const ESCALATION_MATRIX: EscalationMatrixRule[] = [
  { category: 'Industrial Emission', tier: 1, officer_name: 'Field Inspector - Zone A', officer_contact: '+91-9000000001' },
  { category: 'Industrial Emission', tier: 2, officer_name: 'Regional Supervisor', officer_contact: '+91-9000000002' },
  { category: 'Industrial Emission', tier: 3, officer_name: 'DPCC Divisional Head', officer_contact: '+91-9000000003' },
  { category: 'Dust CD', tier: 1, officer_name: 'Field Inspector - Zone B', officer_contact: '+91-9000000011' },
  { category: 'Dust CD', tier: 2, officer_name: 'Regional Supervisor', officer_contact: '+91-9000000002' },
];

// Update the function signature to accept the structured payload object
export async function submitComplaintApi(payload: ComplaintPayload): Promise<ApiResponse<ComplaintResponseData>> {
  try {
    const response = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        accept: 'application/json' 
      },
      // Directly stringify the dynamic payload object passed from the UI
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch {
    // Fallback simulation for offline frontend review
    // We dynamically pull from the payload so the simulated fallback reflects user input
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        category: 'Industrial Emission',
        sub_category: null,
        priority_score: 90,
        priority_tier: 'P1',
        is_urgent: true,
        sentiment_label: 'distressed',
        entities: {
          pollution_source: 'factory',
          // Dynamically reflect the user's input location in the fallback
          landmark: payload.location.area || 'Anand Vihar', 
          time_reference: null,
          quantities: [],
        },
        ai_source: 'llm',
        processing_status: 'processed_llm',
        is_duplicate: true,
        parent_complaint_id: '79d7b83c-bf54-4ffa-8777-50d510778b5c',
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
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch {
    // Fallback data
    const now = new Date();
    const deadline = new Date(now.getTime() + 15 * 60000).toISOString();
    return {
      success: true,
      data: [
        {
          id: '55bf1038-d59b-408d-9378-4fd6bfcac7e7',
          complaint_id: '79d7b83c-bf54-4ffa-8777-50d510778b5c',
          status: 'Open',
          priority_tier: 'P1',
          category: 'Industrial Emission',
          current_tier: 1,
          assigned_officer_name: 'Field Inspector - Zone A',
          assigned_officer_contact: '+91-9000000001',
          sla_deadline: deadline,
          created_at: now.toISOString(),
        },
        {
          id: '77cdbffd-62fa-4da4-814b-7eac8b0f707c',
          complaint_id: 'c23134d9-3f9d-4694-9bdf-f8942137df97',
          status: 'In Progress',
          priority_tier: 'P1',
          category: 'Industrial Emission',
          current_tier: 1,
          assigned_officer_name: 'Field Inspector - Zone A',
          assigned_officer_contact: '+91-9000000001',
          sla_deadline: new Date(now.getTime() - 5 * 60000).toISOString(), // Breached!
          created_at: new Date(now.getTime() - 65 * 60000).toISOString(),
        }
      ],
      error: null,
    };
  }
}

export async function updateTicketStatusApi(id: string, status: string): Promise<ApiResponse<Ticket>> {
  try {
    const response = await fetch(`${BASE_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ status, actor: 'admin' }),
    });
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch {
    return {
      success: true,
      data: {
        id,
        complaint_id: '79d7b83c-bf54-4ffa-8777-50d510778b5c',
        status,
        priority_tier: 'P1',
        category: 'Industrial Emission',
        current_tier: 1,
        assigned_officer_name: 'Field Inspector - Zone A',
        assigned_officer_contact: '+91-9000000001',
        sla_deadline: new Date(Date.now() + 30 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

export async function fetchHotspotsApi(): Promise<ApiResponse<HotspotResponseData>> {
  try {
    const response = await fetch(`${BASE_URL}/analytics/hotspots?hours_back=24`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch {
    return {
      success: true,
      data: {
        buckets: [
          {
            category: 'Industrial Emission',
            area: 'Anand Vihar',
            time_bucket: new Date().toISOString(),
            complaint_count: 14,
            urgent_count: 9,
            avg_priority_score: 92,
          },
          {
            category: 'Dust CD',
            area: 'Okhla Phase II',
            time_bucket: new Date().toISOString(),
            complaint_count: 8,
            urgent_count: 3,
            avg_priority_score: 74,
          },
          {
            category: 'Open Burning',
            area: 'Rohini Sector 16',
            time_bucket: new Date().toISOString(),
            complaint_count: 11,
            urgent_count: 6,
            avg_priority_score: 85,
          }
        ],
        generated_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

// Helper to simulate time travel and trigger SLA matrix escalation
export function simulateSlaEscalation(tickets: Ticket[], advanceMinutes: number): Ticket[] {
  const now = Date.now();
  return tickets.map((ticket) => {
    const deadlineTime = new Date(ticket.sla_deadline).getTime() - (advanceMinutes * 60000);
    const isBreached = deadlineTime < now;
    
    if (isBreached && ticket.current_tier < 3 && ticket.status !== 'Closed') {
      const nextTier = ticket.current_tier + 1;
      const rule = ESCALATION_MATRIX.find(
        (r) => r.category.toLowerCase().includes(ticket.category.toLowerCase().split(' ')[0]) && r.tier === nextTier
      ) || ESCALATION_MATRIX.find((r) => r.tier === nextTier);

      return {
        ...ticket,
        current_tier: nextTier,
        status: 'Escalated',
        assigned_officer_name: rule ? rule.officer_name : `Tier ${nextTier} Officer`,
        assigned_officer_contact: rule ? rule.officer_contact : '+91-9000000099',
        sla_deadline: new Date(now - 1000).toISOString(), // Mark breached
      };
    }
    return ticket;
  });
}
