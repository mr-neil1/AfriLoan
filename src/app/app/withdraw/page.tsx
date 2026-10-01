import { redirect } from "next/navigation";

export default function AppWithdrawRedirect() {
  redirect("/app/repay");
}
