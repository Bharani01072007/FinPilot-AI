import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinPilot AI — AI Financial Operations Platform" },
      {
        name: "description",
        content:
          "FinPilot AI is an enterprise AI financial operations platform with a Secure Document Vault, intelligent underwriting workflows and role‑based portals.",
      },
      { property: "og:title", content: "FinPilot AI — AI Financial Operations Platform" },
      {
        property: "og:description",
        content:
          "Sign in to FinPilot AI: AI‑assisted applications, document vault, risk oversight and executive analytics for financial institutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootRedirect,
});

function RootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.navigate({ to: "/login/role-select" });
  }, []);
  return null;
}
