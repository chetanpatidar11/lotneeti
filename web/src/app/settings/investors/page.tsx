import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/lib/backend";
import PrioritySettings from "./priority-settings";
import type { BankOption, FundingPreference } from "./preferred-funding";

type Workspace = { id: string; name: string; role: string };
type Investor = {
  id: string;
  name: string;
  pan_masked: string;
  planning_priority: number;
  active: boolean;
};

async function getData(path: string, cookieHeader: string) {
  return fetch(backendUrl(path), { headers: { cookie: cookieHeader }, cache: "no-store" });
}

export default async function InvestorSettingsPage() {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader.includes("sessionid=")) redirect("/sign-in");
  const workspaceResponse = await getData("workspaces/", cookieHeader);
  if (!workspaceResponse.ok) redirect("/sign-in");
  const workspaces = (await workspaceResponse.json()) as Workspace[];
  const workspace = workspaces[0];
  let investors: Investor[] = [];
  let banks: BankOption[] = [];
  const preferences: Record<string, FundingPreference[]> = {};
  if (workspace) {
    const [investorsResponse, banksResponse] = await Promise.all([
      getData(`workspaces/${workspace.id}/investors/`, cookieHeader),
      getData(`workspaces/${workspace.id}/banks/`, cookieHeader),
    ]);
    if (investorsResponse.ok) investors = (await investorsResponse.json()) as Investor[];
    if (banksResponse.ok) banks = (await banksResponse.json()) as BankOption[];
    await Promise.all(investors.map(async (investor) => {
      const response = await getData(`workspaces/${workspace.id}/investors/${investor.id}/funding-preferences/`, cookieHeader);
      if (response.ok) preferences[investor.id] = (await response.json()) as FundingPreference[];
    }));
  }

  return <PrioritySettings workspace={workspace ?? null} investors={investors} banks={banks} preferences={preferences} />;
}
