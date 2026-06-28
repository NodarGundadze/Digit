import LoginForm from "@/components/auth/LoginForm";
import { DEMO_PASSWORD } from "@/lib/types";

const DEMO_ACCOUNTS = [
  { name: "Alice — Customer", email: "alice@gmail.com" },
  { name: "Bob — Manager", email: "bob@digit.com" },
  { name: "Charlie — Worker", email: "charlie@digit.com" },
  { name: "Dave — Worker", email: "dave@digit.com" },
  { name: "Emma — Worker", email: "emma@digit.com" },
  { name: "Frank — Worker", email: "frank@digit.com" },
  { name: "Alex — Pending", email: "alex@digit.com", pending: true },
  { name: "Platform Admin", email: "admin@digit.com" },
];

export default function LoginPage() {
  return <LoginForm demoAccounts={DEMO_ACCOUNTS} demoPassword={DEMO_PASSWORD} />;
}
