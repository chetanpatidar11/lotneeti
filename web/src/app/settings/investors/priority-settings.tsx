"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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

export default function PrioritySettings({
  workspace: initialWorkspace,
  investors: initialInvestors,
  banks,
  preferences,
}: {
  workspace: Workspace | null;
  investors: Investor[];
  banks: BankOption[];
  preferences: Record<string, FundingPreference[]>;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [investors, setInvestors] = useState(sortByPriority(initialInvestors));
  const [workspaceName, setWorkspaceName] = useState("");
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });
    if (response.ok) {
      setWorkspace((await response.json()) as Workspace);
      setMessage("");
    } else {
      setMessage("We could not create the workspace. Please try again.");
    }
    setBusy(false);
  }

  async function addInvestor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setBusy(true);
    const response = await fetch(`/api/workspaces/${workspace.id}/investors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, pan, planning_priority: investors.length + 1 }),
    });
    if (response.ok) {
      const investor = (await response.json()) as Investor;
      setInvestors(sortByPriority([...investors, investor]));
      setName("");
      setPan("");
      setMessage("Investor added.");
    } else {
      setMessage("Check the investor details and try again.");
    }
    setBusy(false);
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

  return (
    <main className="page settings-page">
      <div className="shell settings-shell">
        <p className="eyebrow">Settings</p>
        <h1>Investors</h1>
        <p className="intro">Lower planning priority numbers are handled first when money or application limits are tight.</p>
        {!workspace ? (
          <form onSubmit={createWorkspace} className="sign-in-form">
            <label htmlFor="workspace-name">Workspace name</label>
            <input id="workspace-name" required value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
            <button type="submit" disabled={busy}>Create workspace</button>
          </form>
        ) : (
          <>
            <h2>{workspace.name}</h2>
            <AccountImport workspaceId={workspace.id} canEdit={workspace.role !== "VIEWER"} />
            <ul className="investor-list">
              {investors.map((investor, index) => (
                <li key={investor.id}>
                  <span>{investor.name} <small>{investor.pan_masked}</small></span>
                  <label>
                    Priority
                    <input
                      aria-label={`Priority for ${investor.name}`}
                      type="number"
                      min="1"
                      value={investor.planning_priority}
                      disabled={workspace.role === "VIEWER"}
                      onChange={(event) => setInvestors(investors.map((item) => item.id === investor.id ? { ...item, planning_priority: Math.max(1, Number(event.target.value)) } : item))}
                    />
                  </label>
                  {workspace.role !== "VIEWER" && (
                    <span className="order-buttons">
                      <button type="button" aria-label={`Move ${investor.name} up`} disabled={index === 0 || busy} onClick={() => setInvestors(movePriority(investors, index, -1))}>Move up</button>
                      <button type="button" aria-label={`Move ${investor.name} down`} disabled={index === investors.length - 1 || busy} onClick={() => setInvestors(movePriority(investors, index, 1))}>Move down</button>
                    </span>
                  )}
                  <PreferredFunding
                    workspaceId={workspace.id}
                    investor={investor}
                    investors={investors}
                    banks={banks}
                    initialPreferences={preferences[investor.id] ?? []}
                    canEdit={workspace.role !== "VIEWER"}
                  />
                </li>
              ))}
            </ul>
            {workspace.role !== "VIEWER" && (
              <>
                {investors.length > 0 && <button type="button" disabled={busy} onClick={savePriority}>Save priority</button>}
                <form onSubmit={addInvestor} className="sign-in-form add-investor-form">
                  <h2>Add investor</h2>
                  <label htmlFor="investor-name">Name</label>
                  <input id="investor-name" required value={name} onChange={(event) => setName(event.target.value)} />
                  <label htmlFor="investor-pan">PAN</label>
                  <input id="investor-pan" required maxLength={10} autoComplete="off" value={pan} onChange={(event) => setPan(event.target.value)} />
                  <button type="submit" disabled={busy}>Add investor</button>
                </form>
              </>
            )}
          </>
        )}
        {message && <p role="status">{message}</p>}
        <Link href="/">Home</Link>
      </div>
    </main>
  );
}
