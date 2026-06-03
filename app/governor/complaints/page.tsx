import GovernorPage from "@/components/governorC/home";
import { GovernorSidebar } from "@/components/layout/NavbarGubernur";

export default function Complain() {
    return(
        <>
        <GovernorSidebar>
          <GovernorPage/>
        </GovernorSidebar>
        </>
    )
}