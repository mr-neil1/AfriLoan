import { redirect } from "next/navigation";

export default function AdminInvestmentsRedirect() {
  redirect("/admin/loans");
}
