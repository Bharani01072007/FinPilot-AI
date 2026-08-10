/**
 * FinPilot AI — Enterprise Production Banking Dataset Generator
 * Generates 100+ Relational Customers, 300+ Banking Applications, 30 Employees, 300+ Notifications, and 1000+ Audit Logs.
 */

export interface CustomerProfile {
  id: string;
  customer_number: string;
  full_name: string;
  gender: "Male" | "Female";
  dob: string;
  mobile: string;
  email: string;
  address: string;
  aadhaar_masked: string;
  pan_masked: string;
  occupation: string;
  employer: string;
  annual_income: number;
  kyc_status: "VERIFIED" | "PENDING" | "RENEWAL_REQUIRED";
  customer_since: string;
  risk_category: "Low" | "Medium" | "High";
}

export interface EnterpriseApplication {
  id: string;
  application_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  product_category: string;
  application_type: string;
  requested_amount: number;
  sanctioned_amount?: number;
  status: "Draft" | "Submitted" | "Under Review" | "Pending KYC" | "Pending Documents" | "Compliance Review" | "Manager Approval" | "Approved" | "Rejected" | "Closed";
  stage_label: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  risk_score: number;
  risk_level: "Low" | "Medium" | "High";
  dti_ratio: number;
  assigned_employee_id: string;
  assigned_employee_name: string;
  branch: string;
  remarks: string;
  submitted_at: string;
  completed_at?: string;
  ai_summary: {
    executive_summary: string;
    important_findings: string[];
    missing_documents: string[];
    risk_indicators: string[];
    recommended_action: string;
    confidence_score: number;
  };
  workflow_timeline: Array<{
    stage: string;
    actor: string;
    timestamp: string;
    status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
    remarks: string;
  }>;
}

export interface EnterpriseEmployee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: "Employee" | "Manager" | "Admin";
  department: "Loans" | "Operations" | "Compliance" | "Customer Service" | "Accounts";
  branch: string;
  assigned_cases_count: number;
  cases_completed_count: number;
  sla_compliance_rate: number;
  rating: number;
}

export interface EnterpriseNotification {
  id: string;
  user_id: string;
  user_email: string;
  title: string;
  message: string;
  category: "APPLICATION" | "DOCUMENT" | "KYC" | "APPROVAL" | "SECURITY" | "SYSTEM";
  priority: "HIGH" | "MEDIUM" | "LOW";
  read_status: boolean;
  timestamp: string;
}

export interface EnterpriseAuditRecord {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  details: string;
  timestamp: string;
}

// 1. Generate 100 Realistic Banking Customers
const FIRST_NAMES_MALE = ["Bharanidharan", "Gopinath", "Madhiyarasu", "Vikramaditya", "Karthik", "Rohan", "Siddharth", "Arjun", "Rajesh", "Prakash", "Sanjay", "Anand", "Deepak", "Manoj", "Vijay"];
const FIRST_NAMES_FEMALE = ["Deekshitha", "Kaviya", "Vishnupriya", "Priya", "Ananya", "Pooja", "Meera", "Swati", "Lakshmi", "Sneha", "Nivedita", "Shruti", "Gayathri", "Deepika", "Preeti"];
const LAST_NAMES = ["S", "V", "R", "Kumar", "Sharma", "Verma", "Deshmukh", "Nair", "Iyer", "Patel", "Reddy", "Rao", "Joshi", "Gupta", "Chawla"];
const EMPLOYERS = ["TCS Enterprise", "Infosys Technology", "HDFC Financial Corp", "Wipro Digital", "Cognizant India", "Reliance Industries", "L&T Engineering", "Tata Motors", "State Bank Group", "Apollo Healthcare"];
const OCCUPATIONS = ["Senior Software Engineer", "Financial Analyst", "Operations Manager", "Assistant Professor", "Medical Practitioner", "Civil Engineer", "Chartered Accountant", "Business Owner", "Systems Architect", "Marketing Director"];
const BRANCHES = ["Chennai Main Branch", "Mumbai Central Branch", "Krishnagiri Main Branch", "Salem South Branch", "Coimbatore Regional Branch", "Bengaluru Tech Park Branch", "Erode Main Branch", "Hyderabad Regional Office"];

export const ENTERPRISE_CUSTOMERS: CustomerProfile[] = Array.from({ length: 100 }, (_, i) => {
  const isMale = i % 2 === 0;
  const firstName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
  const lastName = LAST_NAMES[i % LAST_NAMES.length];
  const fullName = `${firstName} ${lastName}`;
  const padStr = String(i + 1).padStart(3, "0");

  return {
    id: `cust-ent-${padStr}`,
    customer_number: `CIF-2026-${1000 + i}`,
    full_name: fullName,
    gender: isMale ? "Male" : "Female",
    dob: `${1980 + (i % 25)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    mobile: `+91-${9000000000 + (i * 76543) % 900000000}`,
    email: i === 0 ? "deekshikabil@gmail.com" : i === 1 ? "sbharanidharan2007@gmail.com" : i === 2 ? "gopinath.v.official.01@gmail.com" : i === 3 ? "kabiyakaviya9@gmail.com" : `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@bankdomain.in`,
    address: `No. ${12 + (i % 80)}, ${["Gandhi Road", "Kamaraj Street", "Anna Nagar Main Road", "MG Road", "Mount Road"][i % 5]}, ${BRANCHES[i % BRANCHES.length].split(" ")[0]}, Tamil Nadu - ${600000 + (i % 800)}`,
    aadhaar_masked: `XXXX-XXXX-${4000 + (i * 123) % 5000}`,
    pan_masked: `ABCDE${1000 + i}F`,
    occupation: OCCUPATIONS[i % OCCUPATIONS.length],
    employer: EMPLOYERS[i % EMPLOYERS.length],
    annual_income: 600000 + ((i * 125000) % 3500000),
    kyc_status: i % 15 === 0 ? "RENEWAL_REQUIRED" : i % 20 === 0 ? "PENDING" : "VERIFIED",
    customer_since: `20${15 + (i % 11)}-0${(i % 9) + 1}-15`,
    risk_category: i % 8 === 0 ? "High" : i % 3 === 0 ? "Medium" : "Low",
  };
});

// 2. Generate 30 Employees & Managers
export const ENTERPRISE_EMPLOYEES: EnterpriseEmployee[] = [
  { id: "emp-01", employee_id: "EMP-1001", full_name: "Bharanidharan S", email: "sbharanidharan2007@gmail.com", role: "Admin", department: "Operations", branch: "Headquarters", assigned_cases_count: 24, cases_completed_count: 142, sla_compliance_rate: 99.8, rating: 5.0 },
  { id: "emp-02", employee_id: "EMP-1002", full_name: "Gopinath V", email: "gopinath.v.official.01@gmail.com", role: "Manager", department: "Loans", branch: "Krishnagiri Main Branch", assigned_cases_count: 18, cases_completed_count: 118, sla_compliance_rate: 98.9, rating: 4.9 },
  { id: "emp-03", employee_id: "EMP-1003", full_name: "Kaviya V", email: "kabiyakaviya9@gmail.com", role: "Employee", department: "Operations", branch: "Chennai Main Branch", assigned_cases_count: 15, cases_completed_count: 95, sla_compliance_rate: 98.5, rating: 4.8 },
  { id: "emp-04", employee_id: "EMP-1004", full_name: "Deekshitha S", email: "deekshikabil@gmail.com", role: "Employee", department: "Customer Service", branch: "Coimbatore Branch", assigned_cases_count: 12, cases_completed_count: 88, sla_compliance_rate: 97.9, rating: 4.9 },
  ...Array.from({ length: 26 }, (_, i) => ({
    id: `emp-${i + 5}`,
    employee_id: `EMP-${1005 + i}`,
    full_name: `${["Ramesh", "Suresh", "Priya", "Anitha", "Karthik", "Venkatesh", "Deepa", "Srinivasan"][i % 8]} ${["Nair", "Iyer", "Rao", "Reddy", "Sharma"][i % 5]}`,
    email: `officer.${i + 5}@bankdomain.in`,
    role: i % 6 === 0 ? ("Manager" as const) : ("Employee" as const),
    department: (["Loans", "Operations", "Compliance", "Customer Service", "Accounts"] as const)[i % 5],
    branch: BRANCHES[i % BRANCHES.length],
    assigned_cases_count: 8 + (i % 15),
    cases_completed_count: 45 + (i * 7),
    sla_compliance_rate: 95 + (i % 5),
    rating: 4.5 + (i % 5) * 0.1,
  })),
];

// 3. Generate 300 Interconnected Banking Applications
const PRODUCT_TYPES = [
  { category: "Loans", type: "Home Loan", minAmt: 2500000, maxAmt: 15000000 },
  { category: "Loans", type: "Personal Loan", minAmt: 100000, maxAmt: 1000000 },
  { category: "Loans", type: "Education Loan", minAmt: 500000, maxAmt: 3000000 },
  { category: "Loans", type: "Vehicle Loan", minAmt: 300000, maxAmt: 2500000 },
  { category: "Loans", type: "Gold Loan", minAmt: 50000, maxAmt: 1500000 },
  { category: "Loans", type: "Business Loan", minAmt: 1000000, maxAmt: 10000000 },
  { category: "Loans", type: "MSME Loan", minAmt: 1500000, maxAmt: 20000000 },
  { category: "Cards", type: "Credit Card", minAmt: 50000, maxAmt: 500000 },
  { category: "Accounts", type: "Savings Account", minAmt: 10000, maxAmt: 100000 },
  { category: "Accounts", type: "Current Account", minAmt: 50000, maxAmt: 500000 },
  { category: "Deposits", type: "Fixed Deposit", minAmt: 100000, maxAmt: 5000000 },
  { category: "Deposits", type: "Recurring Deposit", minAmt: 5000, maxAmt: 100000 },
  { category: "Services", type: "Locker Application", minAmt: 5000, maxAmt: 20000 },
  { category: "Services", type: "KYC Update", minAmt: 0, maxAmt: 0 },
  { category: "Services", type: "Address Change", minAmt: 0, maxAmt: 0 },
  { category: "Cards", type: "Debit Card", minAmt: 0, maxAmt: 0 },
  { category: "Services", type: "FASTag", minAmt: 500, maxAmt: 5000 },
  { category: "Insurance", type: "Health Insurance Product", minAmt: 15000, maxAmt: 100000 },
];

const STAGES: Array<EnterpriseApplication["status"]> = [
  "Submitted",
  "Under Review",
  "Pending KYC",
  "Pending Documents",
  "Compliance Review",
  "Manager Approval",
  "Approved",
  "Rejected",
  "Closed",
];

export const ENTERPRISE_APPLICATIONS: EnterpriseApplication[] = Array.from({ length: 300 }, (_, i) => {
  const customer = ENTERPRISE_CUSTOMERS[i % ENTERPRISE_CUSTOMERS.length];
  const prod = PRODUCT_TYPES[i % PRODUCT_TYPES.length];
  const employee = ENTERPRISE_EMPLOYEES[i % ENTERPRISE_EMPLOYEES.length];
  const status = STAGES[i % STAGES.length];
  const requestedAmt = prod.minAmt === 0 ? 0 : prod.minAmt + ((i * 137000) % (prod.maxAmt - prod.minAmt));
  const isApproved = status === "Approved" || status === "Closed";
  const padStr = String(i + 1).padStart(3, "0");

  return {
    id: `app-ent-${padStr}`,
    application_number: `APP-2026-${2000 + i}`,
    customer_id: customer.id,
    customer_name: customer.full_name,
    customer_email: customer.email,
    product_category: prod.category,
    application_type: prod.type,
    requested_amount: requestedAmt,
    sanctioned_amount: isApproved ? Math.round(requestedAmt * 0.95) : undefined,
    status,
    stage_label: status === "Submitted" ? "Online Intake Received" : status === "Under Review" ? "Credit Risk Assessment" : status === "Approved" ? "Sanctioned & Active" : status === "Rejected" ? "Declined / Action Required" : "Processing Active",
    priority: i % 7 === 0 ? "HIGH" : i % 3 === 0 ? "MEDIUM" : "LOW",
    risk_score: 600 + ((i * 17) % 280),
    risk_level: i % 9 === 0 ? "High" : i % 4 === 0 ? "Medium" : "Low",
    dti_ratio: 18 + ((i * 3) % 25),
    assigned_employee_id: employee.id,
    assigned_employee_name: employee.full_name,
    branch: customer.address.split(",")[2] || "Chennai Main Branch",
    remarks: isApproved ? `Sanctioned by ${employee.full_name}. Clean KYC and verified payroll.` : status === "Rejected" ? "DTI threshold exceeded. Missing Q4 turnover proof." : "Verification in progress by credit team.",
    submitted_at: `2026-0${(i % 7) + 1}-${String((i % 25) + 1).padStart(2, "0")}T10:30:00Z`,
    completed_at: isApproved ? `2026-0${(i % 7) + 1}-${String((i % 25) + 3).padStart(2, "0")}T16:45:00Z` : undefined,
    ai_summary: {
      executive_summary: `Applicant ${customer.full_name} (${customer.occupation} at ${customer.employer}) has requested ${prod.type} for ₹${requestedAmt.toLocaleString("en-IN")}. PaddleOCR verified identity documents with 99.4% confidence score.`,
      important_findings: [
        `Verified annual income of ₹${customer.annual_income.toLocaleString("en-IN")}`,
        "KYC e-Sign checksum authenticated via UIDAI API",
        "Credit score 780+ confirmed by credit bureau gateway",
      ],
      missing_documents: status === "Pending Documents" ? ["Property Blueprints Receipt", "Recent 3-Month Bank Statement"] : [],
      risk_indicators: i % 9 === 0 ? ["DTI ratio approaching 45% ceiling", "Recent credit inquiry detected"] : ["Zero adverse fraud indicators"],
      recommended_action: isApproved ? "Proceed to instant digital disbursement." : status === "Rejected" ? "Issue decline letter with DTI breakdown." : "Complete document verification and dispatch to manager approval queue.",
      confidence_score: 99.2,
    },
    workflow_timeline: [
      { stage: "Application Intake", actor: customer.full_name, timestamp: `2026-0${(i % 7) + 1}-01T10:00:00Z`, status: "COMPLETED", remarks: "Form submitted via Customer Portal" },
      { stage: "PaddleOCR Verification", actor: "PaddleOCR Engine", timestamp: `2026-0${(i % 7) + 1}-01T10:02:00Z`, status: "COMPLETED", remarks: "100% extracted identity fields" },
      { stage: "Credit Risk Assessment", actor: employee.full_name, timestamp: `2026-0${(i % 7) + 1}-02T14:20:00Z`, status: isApproved ? "COMPLETED" : "IN_PROGRESS", remarks: "DTI and Income underwriting" },
    ],
  };
});

// 4. Generate 300 Realtime Notifications
export const ENTERPRISE_NOTIFICATIONS: EnterpriseNotification[] = Array.from({ length: 300 }, (_, i) => {
  const cust = ENTERPRISE_CUSTOMERS[i % ENTERPRISE_CUSTOMERS.length];
  const app = ENTERPRISE_APPLICATIONS[i % ENTERPRISE_APPLICATIONS.length];

  return {
    id: `notif-ent-${i + 1}`,
    user_id: cust.id,
    user_email: cust.email,
    title: i % 5 === 0 ? `Sanction Letter Issued (${app.application_number})` : i % 3 === 0 ? `e-KYC Verified for ${cust.full_name}` : `Workflow Event (${app.application_type})`,
    message: `Application ${app.application_number} (${app.application_type}) status updated to ${app.status}. Handled by officer ${app.assigned_employee_name}.`,
    category: (["APPLICATION", "DOCUMENT", "KYC", "APPROVAL", "SECURITY", "SYSTEM"] as const)[i % 6],
    priority: i % 4 === 0 ? "HIGH" : i % 2 === 0 ? "MEDIUM" : "LOW",
    read_status: i % 3 === 0,
    timestamp: `2026-08-07T${String(10 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
  };
});

// 5. Generate 1000 Realtime Audit Log Records
export const ENTERPRISE_AUDIT_LOGS: EnterpriseAuditRecord[] = Array.from({ length: 1000 }, (_, i) => {
  const emp = ENTERPRISE_EMPLOYEES[i % ENTERPRISE_EMPLOYEES.length];
  const app = ENTERPRISE_APPLICATIONS[i % ENTERPRISE_APPLICATIONS.length];
  const ACTIONS = ["USER_LOGIN", "APPLICATION_SUBMITTED", "PADDLE_OCR_EXECUTED", "GROQ_LLM_SUMMARY_GENERATED", "MANAGER_APPROVAL_RECORDED", "REPORT_EXPLOATED_CSV", "REPORT_EXPLOATED_EXCEL"];

  return {
    id: `audit-ent-${i + 1}`,
    actor_name: emp.full_name,
    actor_role: emp.role,
    action: ACTIONS[i % ACTIONS.length],
    resource_type: i % 2 === 0 ? "Application" : "DocumentVault",
    resource_id: app.application_number,
    ip_address: `192.168.1.${10 + (i % 150)}`,
    details: `Executed ${ACTIONS[i % ACTIONS.length]} on ${app.application_number} (${app.application_type})`,
    timestamp: `2026-08-07T${String((i % 24)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}:00Z`,
  };
});
