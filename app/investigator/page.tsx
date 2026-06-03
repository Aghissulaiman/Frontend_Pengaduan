// Di app/investigator/layout.tsx atau app/investigator/page.tsx

import InvestigatorPage from "@/components/Investigator/Home";
import { InvestigatorNavbar } from "@/components/layout/NavbarInvestigator";

export default function InvestigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InvestigatorNavbar/>
      <InvestigatorPage/>
      <main>{children}</main>
    </>
  );
}