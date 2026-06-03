import { AuthGuard } from "@/hooks/auth-guard";
import CompleteProfile from "@/components/auth/konfirmasiData";

export default function CompleteProfilePage() {
  return (
    <AuthGuard>
      <CompleteProfile />
    </AuthGuard>
  );
}