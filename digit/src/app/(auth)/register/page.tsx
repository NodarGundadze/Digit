import RegisterForm from "@/components/auth/RegisterForm";
import { getSkillTags } from "@/lib/settings";

export default async function RegisterPage() {
  const skillTags = await getSkillTags();
  return <RegisterForm skillTags={skillTags} />;
}
