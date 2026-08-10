/**
 * FinPilot AI — Real-Time Enterprise Banking Activity Simulation Engine
 * Continuously simulates live incoming applications, notification alerts, workflow stage transitions,
 * manager approvals, and OCR extractions while the app is running.
 */

import { toast } from "sonner";
import { ENTERPRISE_APPLICATIONS, ENTERPRISE_CUSTOMERS, ENTERPRISE_EMPLOYEES } from "./enterprise-data-store";

class DemoSimulationEngine {
  private timer: any = null;
  private isRunning: boolean = false;
  private tickCount: number = 0;

  public start() {
    // Disabled per user directive
    this.stop();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private tick() {
    this.tickCount += 1;
    const eventType = this.tickCount % 5;

    const randomCust = ENTERPRISE_CUSTOMERS[Math.floor(Math.random() * ENTERPRISE_CUSTOMERS.length)];
    const randomEmp = ENTERPRISE_EMPLOYEES[Math.floor(Math.random() * ENTERPRISE_EMPLOYEES.length)];
    const randomApp = ENTERPRISE_APPLICATIONS[Math.floor(Math.random() * ENTERPRISE_APPLICATIONS.length)];

    const toastOpts = { duration: 3500 };

    switch (eventType) {
      case 0:
        // Simulate New Application Received
        toast.info(`⚡ Live Event: New Application Received`, {
          ...toastOpts,
          description: `${randomCust.full_name} submitted ${randomApp.application_type} for ₹${randomApp.requested_amount.toLocaleString("en-IN")}.`,
        });
        break;

      case 1:
        // Simulate PaddleOCR Scanning Completed
        toast.success(`🔍 PaddleOCR & Groq LLM Scan Complete`, {
          ...toastOpts,
          description: `Extracted identity & payroll fields for ${randomCust.full_name} (Confidence: 99.8%).`,
        });
        break;

      case 2:
        // Simulate Workflow Transition
        toast.info(`🔄 Workflow Stage Transitioned`, {
          ...toastOpts,
          description: `Application ${randomApp.application_number} moved to Manager Approval queue.`,
        });
        break;

      case 3:
        // Simulate Manager Sanction Approval
        toast.success(`✅ Manager Loan Sanction Recorded`, {
          ...toastOpts,
          description: `Sanctioned ${randomApp.application_type} #${randomApp.application_number} (₹${randomApp.requested_amount.toLocaleString("en-IN")}).`,
        });
        break;

      case 4:
        // Simulate System Security Audit Log Event
        toast.info(`🛡️ System Security Audit Log`, {
          ...toastOpts,
          description: `Role assignment verified for ${randomEmp.full_name} (${randomEmp.branch}).`,
        });
        break;
    }
  }
}

export const demoSimulationEngine = new DemoSimulationEngine();
