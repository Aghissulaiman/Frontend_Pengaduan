import { FeedHome } from '@/components/ALL/feed/FeedHome';
import { GovernorSidebar } from '@/components/layout/NavbarGubernur';

export default function DashboardPage() {
  return (
    <GovernorSidebar>
      <FeedHome/>
    </GovernorSidebar>
  );
}