import { UserSidebar } from "@/components/layout/Navbar";
import { LaportPage } from "@/components/user/complaints/Laport";

export default function Laport() {
    return (
        <>
        <UserSidebar>
            <LaportPage/>
        </UserSidebar>
        </>
    )
}