export type RiskLevel = "low" | "medium" | "high";

export interface Contract {
  id: string;
  title: string;
  type: string;
  uploadedAt: string;
  pages: number;
  risk: RiskLevel;
  riskScore: number;
  favorite: boolean;
  summary: string;
}

export const mockUser = {
  name: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  avatar: "AS",
  plan: "Pro",
};

export const mockContracts: Contract[] = [
  {
    id: "c-001",
    title: "SaaS Subscription Agreement — Cloudline Inc.",
    type: "Service Agreement",
    uploadedAt: "2026-07-05",
    pages: 14,
    risk: "high",
    riskScore: 78,
    favorite: true,
    summary:
      "A multi-year SaaS agreement with automatic renewal, limited liability caps, and broad data-usage rights granted to the vendor.",
  },
  {
    id: "c-002",
    title: "Employment Contract — Senior Engineer",
    type: "Employment",
    uploadedAt: "2026-07-02",
    pages: 9,
    risk: "medium",
    riskScore: 52,
    favorite: false,
    summary:
      "Standard employment terms with a 2-year non-compete clause and moderate IP assignment scope.",
  },
  {
    id: "c-003",
    title: "Residential Lease — Bandra Apartment",
    type: "Lease",
    uploadedAt: "2026-06-28",
    pages: 6,
    risk: "low",
    riskScore: 22,
    favorite: false,
    summary:
      "11-month lease with balanced terms, reasonable security deposit, and standard maintenance clauses.",
  },
  {
    id: "c-004",
    title: "Freelance Design Contract",
    type: "Freelance",
    uploadedAt: "2026-06-20",
    pages: 4,
    risk: "low",
    riskScore: 18,
    favorite: true,
    summary: "Short project agreement with clear deliverables, milestones, and payment schedule.",
  },
  {
    id: "c-005",
    title: "NDA — Project Aurora",
    type: "NDA",
    uploadedAt: "2026-06-14",
    pages: 3,
    risk: "medium",
    riskScore: 44,
    favorite: false,
    summary: "Mutual NDA with a 5-year confidentiality term and broad definition of confidential information.",
  },
];

export const contractSections = [
  {
    key: "summary",
    title: "Plain English Summary",
    body:
      "This is a 3-year SaaS subscription. You pay annually in advance. Cloudline can raise fees by up to 8% each renewal. Termination requires 90 days' written notice before the renewal date, otherwise the contract auto-renews.",
  },
  {
    key: "keypoints",
    title: "Key Points",
    body: "• 3-year initial term, auto-renews\n• Annual pre-payment\n• Up to 8% price increase each renewal\n• Limited liability capped at 12 months of fees",
  },
  {
    key: "rights",
    title: "Your Rights",
    body: "• Access to the platform 24/7 with 99.9% uptime SLA\n• Data export within 30 days of termination\n• Right to audit security once per year",
  },
  {
    key: "obligations",
    title: "Your Obligations",
    body: "• Pay invoices within 30 days\n• Do not reverse-engineer the platform\n• Maintain security of your account credentials",
  },
  {
    key: "deadlines",
    title: "Deadlines",
    body: "• Termination notice: 90 days before renewal (next: 15 Sep 2026)\n• Invoice payment: net-30\n• Annual security audit: within Q4",
  },
  {
    key: "penalties",
    title: "Penalties",
    body: "• Late payment: 1.5% per month\n• Early termination fee: remaining contract value\n• Breach of confidentiality: liquidated damages up to ₹50,00,000",
  },
  {
    key: "renewal",
    title: "Renewal",
    body: "Auto-renews for 1-year terms unless terminated with 90 days' written notice.",
  },
  {
    key: "payment",
    title: "Payment Terms",
    body: "Annual pre-payment, net-30. Payment by wire or ACH. Currency: INR.",
  },
];

export const riskyClauses = [
  {
    title: "Automatic Renewal",
    level: "high" as RiskLevel,
    note: "Contract auto-renews for 1-year terms unless you give 90 days' notice.",
  },
  {
    title: "Unilateral Price Increase",
    level: "high" as RiskLevel,
    note: "Vendor may raise fees by up to 8% each renewal — no cap over the full term.",
  },
  {
    title: "Limited Liability",
    level: "medium" as RiskLevel,
    note: "Vendor liability capped at 12 months of fees. Below industry norm for enterprise SaaS.",
  },
  {
    title: "Broad Data Usage Rights",
    level: "medium" as RiskLevel,
    note: "Anonymized customer data may be used for product improvement without further consent.",
  },
];

export const suggestedQuestions = [
  "What are my rights if the vendor is acquired?",
  "Can I negotiate the auto-renewal clause?",
  "What happens to my data after termination?",
  "Is the liability cap enforceable in India?",
];

export const initialChat = [
  {
    id: "m1",
    role: "ai" as const,
    text: "Hi Aarav 👋 I'm NeedhiAI, your legal assistant. I can explain clauses, compare contracts, or answer questions in plain English. What would you like to know?",
    time: "10:12",
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Cloudline renewal in 70 days",
    body: "Send termination notice by 15 Sep 2026 to avoid auto-renewal.",
    time: "2h ago",
    kind: "deadline" as const,
  },
  {
    id: "n2",
    title: "New high-risk contract analyzed",
    body: "SaaS Subscription Agreement flagged 4 high-risk clauses.",
    time: "Yesterday",
    kind: "analysis" as const,
  },
  {
    id: "n3",
    title: "AI recommendation",
    body: "You could save ₹1,20,000/year by negotiating the price-lock clause.",
    time: "2 days ago",
    kind: "tip" as const,
  },
];

export const processingSteps = [
  "Extracting text from document…",
  "Identifying clauses and sections…",
  "Performing risk analysis…",
  "Cross-referencing legal precedents…",
  "Generating plain-English summary…",
];
