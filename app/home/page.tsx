import { FeedHome } from "@/components/ALL/feed/FeedHome";
import { UserSidebar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/hooks/auth-guard";

export default function HomePage() {
    return (
        <AuthGuard>
            <UserSidebar>
                <FeedHome/>
            </UserSidebar>
        </AuthGuard>
    )
}