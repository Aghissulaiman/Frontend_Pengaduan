import InvestigatorComplaintDetailPage from "@/components/Investigator/Complain";
import { InvestigatorNavbar } from "@/components/layout/NavbarInvestigator";

export default function InvestigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InvestigatorNavbar/>
      <InvestigatorComplaintDetailPage/>
      <main>{children}</main>
    </>
  );
}