import { UserSidebar } from "@/components/layout/Navbar";
import ChatFullPage from "@/components/ALL/chat/ChatFull";

export default function chats() {
    return (
        <>
        <UserSidebar>
            <ChatFullPage/>
        </UserSidebar>
        </>
    )
}