import { UserSidebar } from "@/components/layout/Navbar";
import { GovernorSidebar } from "@/components/layout/NavbarGubernur";
import ChatPage from "@/components/ALL/chat/Chat";

export default function chatsG() {
    return (
        <>
        
                <GovernorSidebar>
            <ChatPage/>
                </GovernorSidebar>
        </>
    )
}