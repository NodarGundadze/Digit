import { Brand } from "@/components/Brand";
import RegisterForm from "@/components/auth/RegisterForm";
import { getSkillTags } from "@/lib/settings";

export default async function RegisterPage() {
  const skillTags = await getSkillTags();
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Brand subtitle="IT Operations Marketplace" size="lg" />
      </div>
      <RegisterForm skillTags={skillTags} />
    </div>
  );
}
