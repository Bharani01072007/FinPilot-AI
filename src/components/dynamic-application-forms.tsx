import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, FileText, Building2, Home, CreditCard, Wallet, Car, Briefcase } from "lucide-react";

export interface DynamicFormProps {
  productType: string;
  initialValues?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
  submitting?: boolean;
}

export function DynamicApplicationForm({ productType, initialValues = {}, onSubmit, submitting = false }: DynamicFormProps) {
  // Common Fields
  const [fullName, setFullName] = useState(initialValues.fullName || "Deekshitha R S");
  const [email, setEmail] = useState(initialValues.email || "deekshikabil@gmail.com");
  const [mobile, setMobile] = useState(initialValues.mobile || "+91 98765 43210");

  // Product Specific States
  // Home Loan
  const [propType, setPropType] = useState("Apartment / Flat");
  const [propAddress, setPropAddress] = useState(initialValues.propAddress || "Flat 402, Skyline Residency, Bandra West, Mumbai 400050");
  const [propValue, setPropValue] = useState(initialValues.propValue || "8500000");
  const [downPayment, setDownPayment] = useState(initialValues.downPayment || "1700000");
  const [loanAmount, setLoanAmount] = useState(initialValues.loanAmount || "6800000");
  const [tenureYears, setTenureYears] = useState("20");
  const [annualIncome, setAnnualIncome] = useState(initialValues.annualIncome || "2400000");
  const [existingEmi, setExistingEmi] = useState(initialValues.existingEmi || "15000");
  const [coAppName, setCoAppName] = useState("Karthik R S");
  const [coAppRelation, setCoAppRelation] = useState("Spouse");
  const [coAppPan, setCoAppPan] = useState("XYZPK9876Q");
  const [nomineeName, setNomineeName] = useState("Meera R S");
  const [nomineeRelation, setNomineeRelation] = useState("Daughter");

  // Personal Loan
  const [empType, setEmpType] = useState("Salaried");
  const [employerName, setEmployerName] = useState(initialValues.employerName || "Northwind Systems Pvt Ltd");
  const [monthlyIncome, setMonthlyIncome] = useState(initialValues.monthlyIncome || "200000");
  const [loanPurpose, setLoanPurpose] = useState("Home Renovation & Medical");

  // Credit Card
  const [prefLimit, setPrefLimit] = useState("300000");
  const [existingCards, setExistingCards] = useState("HDFC Regalia (Limit ₹2.5L)");
  const [designation, setDesignation] = useState("Lead Software Architect");

  // Savings Account
  const [accountType, setAccountType] = useState("Salary Account (Zero Balance)");
  const [initialDeposit, setInitialDeposit] = useState("10000");
  const [fatcaDeclared, setFatcaDeclared] = useState(true);

  // Auto Loan
  const [vehType, setVehType] = useState("EV Four-Wheeler");
  const [vehModel, setVehModel] = useState("Tata Nexon EV Empowered+");
  const [dealerName, setDealerName] = useState("Prerana Motors Pvt Ltd");
  const [onRoadPrice, setOnRoadPrice] = useState("1850000");

  // Business Loan
  const [bizName, setBizName] = useState("Northwind Retail Enterprises");
  const [bizType, setBizType] = useState("Private Limited");
  const [annualTurnover, setAnnualTurnover] = useState("12000000");
  const [gstin, setGstin] = useState("27ABCDE1234F1Z5");

  // Compliance Consent
  const [kycConsent, setKycConsent] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, any> = {
      fullName,
      email,
      mobile,
      productType,
      kycConsent,
    };

    if (productType.includes("Home Loan") || productType.includes("Housing")) {
      Object.assign(data, {
        propType,
        propAddress,
        propValue: parseFloat(propValue) || 0,
        downPayment: parseFloat(downPayment) || 0,
        requested_amount: parseFloat(loanAmount) || 0,
        tenureYears,
        annualIncome: parseFloat(annualIncome) || 0,
        existingEmi: parseFloat(existingEmi) || 0,
        coAppName,
        coAppRelation,
        coAppPan,
        nomineeName,
        nomineeRelation,
      });
    } else if (productType.includes("Personal Loan")) {
      Object.assign(data, {
        empType,
        employerName,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        requested_amount: parseFloat(loanAmount) || 0,
        loanPurpose,
      });
    } else if (productType.includes("Credit Card")) {
      Object.assign(data, {
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        employerName,
        designation,
        requested_amount: parseFloat(prefLimit) || 0,
        existingCards,
      });
    } else if (productType.includes("Savings")) {
      Object.assign(data, {
        accountType,
        initialDeposit: parseFloat(initialDeposit) || 0,
        nomineeName,
        fatcaDeclared,
        requested_amount: parseFloat(initialDeposit) || 0,
      });
    } else if (productType.includes("Auto") || productType.includes("Vehicle")) {
      Object.assign(data, {
        vehType,
        vehModel,
        dealerName,
        onRoadPrice: parseFloat(onRoadPrice) || 0,
        downPayment: parseFloat(downPayment) || 0,
        requested_amount: parseFloat(loanAmount) || 0,
      });
    } else {
      Object.assign(data, {
        bizName,
        bizType,
        annualTurnover: parseFloat(annualTurnover) || 0,
        gstin,
        requested_amount: parseFloat(loanAmount) || 0,
      });
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      {/* Top Header Badge */}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
            {productType.includes("Home") ? (
              <Home className="size-5" />
            ) : productType.includes("Personal") ? (
              <Wallet className="size-5" />
            ) : productType.includes("Credit Card") ? (
              <CreditCard className="size-5" />
            ) : productType.includes("Savings") ? (
              <Building2 className="size-5" />
            ) : productType.includes("Auto") ? (
              <Car className="size-5" />
            ) : (
              <Briefcase className="size-5" />
            )}
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">{productType}</p>
            <p className="text-xs text-muted-foreground">Dedicated Banking Application Workflow</p>
          </div>
        </div>
        <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success flex items-center gap-1">
          <ShieldCheck className="size-3.5" /> RBI Compliant
        </span>
      </div>

      {/* Customer Basic Info */}
      <div className="space-y-3">
        <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Applicant Identity</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 rounded-xl" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 rounded-xl" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mobile Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="h-9 rounded-xl" required />
          </div>
        </div>
      </div>

      {/* Product-Specific Workflow Sections */}
      {(productType.includes("Home Loan") || productType.includes("Housing")) && (
        <>
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Property & Mortgage Details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Property Type</Label>
                <select value={propType} onChange={(e) => setPropType(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs">
                  <option>Apartment / Flat</option>
                  <option>Independent House / Villa</option>
                  <option>Residential Plot + Construction</option>
                  <option>Commercial Property</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estimated Property Market Value (₹)</Label>
                <Input type="number" value={propValue} onChange={(e) => setPropValue(e.target.value)} className="h-9 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Property Address</Label>
              <Input value={propAddress} onChange={(e) => setPropAddress(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Loan Amount (₹)</Label>
                <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="h-9 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Down Payment (₹)</Label>
                <Input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="h-9 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tenure (Years)</Label>
                <select value={tenureYears} onChange={(e) => setTenureYears(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs">
                  <option value="10">10 Years</option>
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                  <option value="25">25 Years</option>
                  <option value="30">30 Years</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">3. Employment, Co-Applicant & Nominee</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Annual Net Income (₹)</Label>
                <Input type="number" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} className="h-9 rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Existing Monthly EMIs (₹)</Label>
                <Input type="number" value={existingEmi} onChange={(e) => setExistingEmi(e.target.value)} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Co-Applicant Name</Label>
                <Input value={coAppName} onChange={(e) => setCoAppName(e.target.value)} className="h-9 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Co-Applicant Relation</Label>
                <Input value={coAppRelation} onChange={(e) => setCoAppRelation(e.target.value)} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Co-Applicant PAN</Label>
                <Input value={coAppPan} onChange={(e) => setCoAppPan(e.target.value)} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nominee Name</Label>
                <Input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} className="h-9 rounded-xl" />
              </div>
            </div>
          </div>
        </>
      )}

      {productType.includes("Personal Loan") && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Financial & Income Details</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Employer Name</Label>
              <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monthly Net Income (₹)</Label>
              <Input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Requested Loan Amount (₹)</Label>
              <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loan Purpose</Label>
              <Input value={loanPurpose} onChange={(e) => setLoanPurpose(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
        </div>
      )}

      {productType.includes("Credit Card") && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Occupation & Credit Limit</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Corporate Employer Name</Label>
              <Input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Designation</Label>
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Preferred Credit Limit (₹)</Label>
              <Input type="number" value={prefLimit} onChange={(e) => setPrefLimit(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Existing Credit Cards Held</Label>
              <Input value={existingCards} onChange={(e) => setExistingCards(e.target.value)} className="h-9 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {productType.includes("Savings") && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Account Configuration & Nominee</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Savings Account Type</Label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs">
                <option>Salary Account (Zero Balance)</option>
                <option>Regular Savings Account</option>
                <option>Premium Wealth Savings Account</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Initial Deposit Amount (₹)</Label>
              <Input type="number" value={initialDeposit} onChange={(e) => setInitialDeposit(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Nominee Name</Label>
              <Input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nominee Relationship</Label>
              <Input value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
        </div>
      )}

      {(productType.includes("Auto") || productType.includes("Vehicle")) && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">2. Vehicle & Dealer Details</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Vehicle Category</Label>
              <select value={vehType} onChange={(e) => setVehType(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs">
                <option>EV Four-Wheeler</option>
                <option>Petrol / Diesel SUV</option>
                <option>Commercial Light Vehicle</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Make & Model</Label>
              <Input value={vehModel} onChange={(e) => setVehModel(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Dealer Name</Label>
              <Input value={dealerName} onChange={(e) => setDealerName(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">On-Road Price (₹)</Label>
              <Input type="number" value={onRoadPrice} onChange={(e) => setOnRoadPrice(e.target.value)} className="h-9 rounded-xl" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loan Requested (₹)</Label>
              <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="h-9 rounded-xl" required />
            </div>
          </div>
        </div>
      )}

      {/* Mandatory KYC Consent Checkbox */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          id="kycConsent"
          checked={kycConsent}
          onChange={(e) => setKycConsent(e.target.checked)}
          className="mt-0.5 rounded border-border"
          required
        />
        <label htmlFor="kycConsent" className="text-muted-foreground leading-snug cursor-pointer">
          I authorize FinPilot AI & banking partner to fetch e-KYC documents from my Vault and pull CIBIL credit score under RBI digital lending guidelines.
        </label>
      </div>

      <Button type="submit" disabled={submitting} className="w-full h-10 rounded-xl bg-brand text-white font-semibold shadow-glow">
        {submitting ? "Processing Application..." : `Submit ${productType} Application`}
      </Button>
    </form>
  );
}
