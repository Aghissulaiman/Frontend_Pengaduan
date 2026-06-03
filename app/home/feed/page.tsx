import { FeedHome } from "@/components/ALL/feed/FeedHome";
import { UserSidebar } from "@/components/layout/Navbar";

export default function Feed() {
    return (
        <>
        <UserSidebar>
        <FeedHome/>
        </UserSidebar>
        </>
    )
}