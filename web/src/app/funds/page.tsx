import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/lib/backend";
import FundsScreen from "./funds-screen";
import type { ScheduledPayment } from "./scheduled-payments";

type Workspace = { id: string; name: string; role: string };
type Investor = { id: string; name: string };
type Bank = {
  id: string;
  owner: string;
  bank_name: string;
  account_masked: string;
  current_balance: string;
  active: boolean;
};
type Change = {
  id: number;
  operation: "ADD" | "REMOVE" | "SET";
  amount: string;
  balance: string;
  note: string;
  created_at: string;
};

async function getData(path: string, cookieHeader: string) {
  return fetch(backendUrl(path), { headers: { cookie: cookieHeader }, cache: "no-store" });
}

export default async function FundsPage() {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader.includes("sessionid=")) redirect("/sign-in");
  const workspaceResponse = await getData("workspaces/", cookieHeader);
  if (!workspaceResponse.ok) redirect("/sign-in");
  const workspaces = (await workspaceResponse.json()) as Workspace[];
  const workspace = workspaces[0];
  if (!workspace) redirect("/settings/investors");

  const [banksResponse, investorsResponse] = await Promise.all([
    getData(`workspaces/${workspace.id}/banks/`, cookieHeader),
    getData(`workspaces/${workspace.id}/investors/`, cookieHeader),
  ]);
  const banks = banksResponse.ok ? ((await banksResponse.json()) as Bank[]) : [];
  const investors = investorsResponse.ok ? ((await investorsResponse.json()) as Investor[]) : [];
  let changes: Change[] = [];
  let payments: ScheduledPayment[] = [];
  if (banks[0]) {
    const [historyResponse, paymentsResponse] = await Promise.all([
      getData(`workspaces/${workspace.id}/banks/${banks[0].id}/balance-changes/`, cookieHeader),
      getData(`workspaces/${workspace.id}/banks/${banks[0].id}/recurring-debits/`, cookieHeader),
    ]);
    if (historyResponse.ok) changes = (await historyResponse.json()) as Change[];
    if (paymentsResponse.ok) payments = (await paymentsResponse.json()) as ScheduledPayment[];
  }

  return <FundsScreen workspace={workspace} investors={investors} initialBanks={banks} initialChanges={changes} initialPayments={payments} />;
}
