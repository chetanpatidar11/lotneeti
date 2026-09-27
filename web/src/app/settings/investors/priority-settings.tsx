"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/drawer";
import { EmptyState, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { movePriority, sortByPriority } from "@/lib/priorities";
import PreferredFunding, { type BankOption, type FundingPreference } from "./preferred-funding";
import AccountImport from "./account-import";

type Workspace = { id: string; name: string; role: string };
type Investor = {
  id: string;
  name: string;
  pan_masked: string;
  planning_priority: number;
  active: boolean;
};
type LinkedAccounts = Record<string, {
  demats: { id: string; depository: string; dp_id_masked: string; client_id_masked: string; broker: string; active: boolean }[];
  upis: { id: string; holder: string; handle_masked: string; active: boolean; verified: boolean }[];
}>;

export default function PrioritySettings({
  workspace: initialWorkspace,
  investors: initialInvestors,
  banks,
  preferences,
  linkedAccounts,
  loadError,
}: {
  workspace: Workspace | null;
  investors: Investor[];
  banks: BankOption[];
  preferences: Record<string, FundingPreference[]>;
  linkedAccounts: LinkedAccounts;
  loadError: boolean;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [investors, setInvestors] = useState(sortByPriority(initialInvestors));
  const [tab, setTab] = useState<"investors" | "funding" | "accounts" | "import">("investors");
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = workspace?.role !== "VIEWER";
  const focusedInvestor = investors.find((investor) => investor.id === selectedInvestor);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });
      if (!response.ok) throw new Error("Create failed");
      setWorkspace((await response.json()) as Workspace);
      setMessage("");
    } catch {
      setMessage("We could not create the workspace. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addInvestor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/investors`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, pan, planning_priority: investors.length + 1 }),
      });
      if (!response.ok) throw new Error("Create failed");
      const investor = (await response.json()) as Investor;
      setInvestors(sortByPriority([...investors, investor]));
      setName("");
      setPan("");
      setShowAddInvestor(false);
      setMessage("Investor added.");
    } catch {
      setMessage("Check the investor details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function savePriority() {
    if (!workspace) return;
    setBusy(true);
    try {
      for (const investor of investors) {
        const response = await fetch(`/api/workspaces/${workspace.id}/investors/${investor.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ planning_priority: investor.planning_priority }),
        });
        if (!response.ok) throw new Error("Save failed");
      }
      setInvestors(sortByPriority(investors));
      setMessage("Planning priority saved.");
    } catch {
      setMessage("We could not save the order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="page settings-page"><div className="shell settings-shell">
    <PageHeader eyebrow="Workspace" title="Settings" description={workspace ? workspace.name : "Set up a workspace to start planning."} />
    {loadError ? <div className="plan-error" role="alert">Settings could not be loaded. <button type="button" className="button-secondary" onClick={() => window.location.reload()}>Retry</button></div> : !workspace ? <form onSubmit={createWorkspace} className="sign-in-form settings-create-workspace">
      <label htmlFor="workspace-name">Workspace name</label>
      <input id="workspace-name" required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
      <button type="submit" disabled={busy}>Create workspace</button>
    </form> : <>
      <nav className="settings-tabs" aria-label="Settings sections">
        {([ ["investors", "Investors"], ["funding", "Funding Preferences"], ["accounts", "Accounts"], ["import", "Import"] ] as const).map(([key, label]) => <button key={key} type="button" className={tab === key ? "settings-tab active" : "settings-tab"} aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setSelectedInvestor(null); }}>{label}</button>)}
      </nav>
      {tab === "investors" && <section aria-label="Investors">
        <SectionHeading title="Investors" detail="Priority decides who is planned first when funds or application limits are tight." action={canEdit && <div className="settings-section-actions"><button type="button" className="button-secondary" disabled={busy || investors.length === 0} onClick={() => void savePriority()}>Save priority</button><button type="button" onClick={() => setShowAddInvestor(true)}>+ Add investor</button></div>} />
        {investors.length === 0 ? <EmptyState title="No investors yet" detail="Add an investor to begin planning IPO applications." /> : <div className="settings-table-wrap"><table className="settings-table"><thead><tr><th scope="col">Investor</th><th scope="col">PAN</th><th scope="col">Priority</th><th scope="col">Demat</th><th scope="col">Banks</th><th scope="col">UPIs</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead><tbody>
          {investors.map((investor, index) => <tr key={investor.id}>
            <th scope="row" data-label="Investor">{investor.name}</th><td data-label="PAN">{investor.pan_masked}</td>
            <td data-label="Priority"><div className="settings-priority"><input aria-label={`Priority for ${investor.name}`} type="number" min="1" value={investor.planning_priority} disabled={!canEdit || busy} onChange={(event) => setInvestors(investors.map((item) => item.id === investor.id ? { ...item, planning_priority: Math.max(1, Number(event.target.value)) } : item))} />{canEdit && <span className="settings-order"><button type="button" className="button-ghost" aria-label={`Move ${investor.name} up`} disabled={index === 0 || busy} onClick={() => setInvestors(movePriority(investors, index, -1))}>↑</button><button type="button" className="button-ghost" aria-label={`Move ${investor.name} down`} disabled={index === investors.length - 1 || busy} onClick={() => setInvestors(movePriority(investors, index, 1))}>↓</button></span>}</div></td>
            <td data-label="Demat">{linkedAccounts[investor.id]?.demats.length ?? 0}</td>
            <td data-label="Banks">{banks.filter((bank) => bank.owner === investor.id).length}</td>
            <td data-label="UPIs">{linkedAccounts[investor.id]?.upis.length ?? 0}</td>
            <td data-label="Status"><StatusBadge tone={investor.active ? "positive" : "neutral"}>{investor.active ? "Active" : "Inactive"}</StatusBadge></td>
            <td data-label="Details"><button type="button" className="button-secondary" onClick={() => setSelectedInvestor(investor.id)}>View</button></td>
          </tr>)}</tbody></table></div>}
      </section>}
      {tab === "funding" && <section aria-label="Funding preferences"><SectionHeading title="Funding Preferences" detail="Choose an investor to review and order their preferred accounts." />
        {investors.length === 0 ? <EmptyState title="No investors yet" detail="Add an investor before setting funding preferences." /> : <div className="settings-funding-list">{investors.map((investor) => <button type="button" key={investor.id} className="settings-funding-row" onClick={() => setSelectedInvestor(investor.id)}><span><strong>{investor.name}</strong><small>{investor.pan_masked}</small></span><span>{preferences[investor.id]?.filter((item) => item.enabled).length ?? 0} preferred · {banks.filter((bank) => bank.owner === investor.id).length} own bank(s)</span><span aria-hidden="true">›</span></button>)}</div>}
      </section>}
      {tab === "accounts" && <section aria-label="Accounts"><SectionHeading title="Accounts" detail="Open an account area or choose an investor to review linked accounts." /><div className="settings-account-links"><Link href="/funds">Bank Accounts <span>Balances and scheduled payments →</span></Link><button type="button" onClick={() => setTab("investors")}>Demat Accounts <span>Choose an investor →</span></button><button type="button" onClick={() => setTab("investors")}>UPIs <span>Choose an investor →</span></button><Link href="/plan">Planner Preferences <span>Review modes and plan →</span></Link></div></section>}
      {tab === "import" && <AccountImport workspaceId={workspace.id} canEdit={canEdit} />}
      {focusedInvestor && <Drawer title={focusedInvestor.name} onClose={() => setSelectedInvestor(null)}><div className="settings-investor-detail"><p><strong>PAN</strong><span>{focusedInvestor.pan_masked}</span></p><p><strong>Status</strong><StatusBadge tone={focusedInvestor.active ? "positive" : "neutral"}>{focusedInvestor.active ? "Active" : "Inactive"}</StatusBadge></p></div><div className="settings-linked"><h3>Demat Accounts</h3>{linkedAccounts[focusedInvestor.id]?.demats.length ? linkedAccounts[focusedInvestor.id].demats.map((demat) => <p key={demat.id}>{demat.depository} · {demat.dp_id_masked} / {demat.client_id_masked} <small>{demat.broker}</small></p>) : <p>No demat accounts yet.</p>}<h3>Bank Accounts</h3>{banks.filter((bank) => bank.owner === focusedInvestor.id).map((bank) => <p key={bank.id}>{bank.bank_name} · {bank.account_masked}</p>)}<h3>UPIs</h3>{linkedAccounts[focusedInvestor.id]?.upis.length ? linkedAccounts[focusedInvestor.id].upis.map((upi) => <p key={upi.id}>{upi.handle_masked} <small>{upi.verified ? "Verified" : "Not verified"}</small></p>) : <p>No UPIs yet.</p>}</div><PreferredFunding key={focusedInvestor.id} workspaceId={workspace.id} investor={focusedInvestor} investors={investors} banks={banks} initialPreferences={preferences[focusedInvestor.id] ?? []} canEdit={canEdit} /></Drawer>}
      {showAddInvestor && <Drawer title="Add investor" onClose={() => setShowAddInvestor(false)}><form onSubmit={addInvestor} className="sign-in-form"><label htmlFor="investor-name">Name</label><input id="investor-name" required value={name} onChange={(event) => setName(event.target.value)} /><label htmlFor="investor-pan">PAN</label><input id="investor-pan" required maxLength={10} autoComplete="off" value={pan} onChange={(event) => setPan(event.target.value)} /><button type="submit" disabled={busy}>Add investor</button></form></Drawer>}
    </>}
    {message && <p role="status" className="settings-message">{message}</p>}
  </div></main>;
}
