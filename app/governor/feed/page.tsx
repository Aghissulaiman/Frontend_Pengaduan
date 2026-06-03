import { FeedHome } from '@/components/ALL/feed/FeedHome';
import { GovernorSidebar } from '@/components/layout/NavbarGubernur';

export default function FeedPage() {
  return (
    <GovernorSidebar>
      <FeedHome/>
    </GovernorSidebar>
  );
}