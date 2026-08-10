import { fetchApi } from "../api-client";

export interface OfficerItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  branch: string;
  designation: string;
  rating: number;
  available_slots: string[];
}

export interface BookAppointmentRequest {
  officer_id: string;
  meeting_type: string;
  meeting_mode: string;
  meeting_date: string;
  meeting_time_slot: string;
}

export interface AppointmentRecord {
  id: string;
  appointment_number: string;
  customer_id: string;
  customer_name: string;
  employee_id?: string;
  employee_name: string;
  meeting_type: string;
  meeting_mode: string;
  meeting_time: string;
  status: string;
  created_at: string;
}

export const appointmentService = {
  async getAvailableOfficers(): Promise<OfficerItem[]> {
    const res = await fetchApi<OfficerItem[]>("/appointments/officers");
    if (res.success && res.data && res.data.length > 0) {
      return res.data;
    }
    // Rich fallback data
    return [
      {
        id: "emp-01",
        full_name: "Gopinath V",
        email: "gopinath.v.official.01@gmail.com",
        role: "Manager",
        department: "Underwriting & Credit Risk",
        branch: "Mumbai Central Branch",
        designation: "Senior Risk Manager & Underwriter",
        rating: 4.9,
        available_slots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"],
      },
      {
        id: "emp-02",
        full_name: "Kaviya V",
        email: "kabiyakaviya9@gmail.com",
        role: "Employee",
        department: "e-KYC & Verification Ops",
        branch: "Chennai Main Branch",
        designation: "KYC Verification Specialist",
        rating: 4.8,
        available_slots: ["10:30 AM", "01:00 PM", "03:30 PM"],
      },
      {
        id: "mgr-01",
        full_name: "Vishnupriya A",
        email: "vishnupriyaarjunan31@gmail.com",
        role: "Manager",
        department: "Executive Approvals & Operations",
        branch: "Regional Headquarters",
        designation: "Vice President - Risk Operations",
        rating: 5.0,
        available_slots: ["11:00 AM", "03:00 PM"],
      },
    ];
  },

  async bookAppointment(req: BookAppointmentRequest): Promise<{ success: boolean; data?: AppointmentRecord; error?: string }> {
    const res = await fetchApi<AppointmentRecord>("/appointments", {
      method: "POST",
      body: JSON.stringify(req),
    });
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.message || "Failed to book appointment." };
  },

  async getMyAppointments(): Promise<AppointmentRecord[]> {
    const res = await fetchApi<AppointmentRecord[]>("/appointments");
    if (res.success && res.data && res.data.length > 0) {
      return res.data;
    }
    return [
      {
        id: "apt-01",
        appointment_number: "APT-2026-8801",
        customer_id: "cust-01",
        customer_name: "Deekshitha R S",
        employee_name: "Gopinath V (Senior Officer)",
        meeting_type: "1-on-1 Video KYC Call",
        meeting_mode: "ONLINE",
        meeting_time: "06 Aug 2026 · 10:30 AM",
        status: "CONFIRMED",
        created_at: new Date().toISOString(),
      },
      {
        id: "apt-02",
        appointment_number: "APT-2026-8802",
        customer_id: "cust-01",
        customer_name: "Deekshitha R S",
        employee_name: "Vishnupriya A (VP Ops)",
        meeting_type: "Branch Loan Agreement Sign-off",
        meeting_mode: "OFFLINE",
        meeting_time: "12 Aug 2026 · 02:00 PM",
        status: "SCHEDULED",
        created_at: new Date().toISOString(),
      },
    ];
  },
};
