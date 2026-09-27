"use client";

import Link from "next/link";
import { useState } from "react";
import { applicationHistory, type ApplicationHistoryInput } from "@/lib/application-history";
import { formatInr } from "@/lib/money";

export type ApplicationItem = ApplicationHistoryInput & {
  id: string;
  ipo_name: string;
  applicant_name: string;
  bank_label: string;
  category: string;
  lots: number;
  max_quantity: number;
};

function displayTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(status: ApplicationItem["status"]): string {
  return ({ PLANNED: "Planned", SUBMITTED: "Submitted", BLOCKED: "Blocked", ALLOTTED: "Allotted", NOT_ALLOTTED: "Not allotted" })[status];
}

function AllotmentForm({ item, busy, onSave }: { item: ApplicationItem; busy: boolean; onSave: (quantity: number, actualCost: string) => void }) {
  const [quantity, setQuantity] = useState("");
  const [actualCost, setActualCost] = useState("");
  return <form className="allotment-form" onSubmit={(event) => {
    event.preventDefault();
    onSave(Number(quantity), actualCost);
  }}>
    <label>Allotted shares<input type="number" min="1" max={item.max_quantity} step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label>Actual cost (₹)<input type="number" min="0.01" step="0.01" required value={actualCost} onChange={(event) => setActualCost(event.target.value)} /></label>
    <button type="submit" disabled={busy}>Mark Allotted</button>
  </form>;
}

export default function ApplicationsScreen({ workspaceId, canEdit, initialItems, latestRun }: {
  workspaceId: string;
  canEdit: boolean;
  initialItems: ApplicationItem[];
  latestRun: { id: string | null; status: "READY" | "BLOCKED" | null };
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startTracking() {
    if (!latestRun.id || latestRun.status !== "READY") return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/planner/runs/${latestRun.id}/track`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "We could not start tracking this plan.");
      setItems((current) => {
        const tracked = result as ApplicationItem[];
        const trackedIds = new Set(tracked.map((item) => item.id));
        return [...tracked, ...current.filter((item) => !trackedIds.has(item.id))];
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not start tracking this plan.");
    } finally {
      setBusy(false);
    }
  }

  async function update(item: ApplicationItem, action: "submit" | "block" | "not-allotted") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/applications/${item.id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "We could not update this application.");
      setItems((current) => current.map((entry) => entry.id === item.id ? result as ApplicationItem : entry));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not update this application.");
    } finally {
      setBusy(false);
    }
  }

  async function recordAllotment(item: ApplicationItem, quantity: number, actualCost: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/applications/${item.id}/allotted`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity, actual_cost: actualCost }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "We could not record this allotment.");
      setItems((current) => current.map((entry) => entry.id === item.id ? result as ApplicationItem : entry));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not record this allotment.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="page settings-page"><div className="shell settings-shell">
    <p className="eyebrow">Applications</p>
    <h1>Track applications</h1>
    <p className="intro">Mark an application Submitted after you place it, then Blocked when the mandate holds the money.</p>
    {canEdit && latestRun.id && <button type="button" disabled={busy || latestRun.status !== "READY"} onClick={() => void startTracking()}>Track latest plan</button>}
    {error && <p className="plan-error" role="alert">{error}</p>}
    {items.length === 0 ? <p className="plan-note">No applications are being tracked yet. <Link href="/plan">Review a plan</Link> first.</p> : <div className="application-list">
      {items.map((item) => <article className="application-card" key={item.id}>
        <div><h2>{item.ipo_name}</h2><p>{item.applicant_name} · {item.category === "SHNI" ? "sHNI" : "Retail"} · {item.lots} {item.lots === 1 ? "lot" : "lots"}</p><small>{item.bank_label}</small></div>
        <div><strong>{formatInr(item.amount)}</strong><p className={`plan-status ${item.status === "BLOCKED" ? "blocking" : "ready"}`}>{statusLabel(item.status)}</p></div>
        {canEdit && <div className="application-actions">
          {item.status === "PLANNED" && <button type="button" disabled={busy} onClick={() => void update(item, "submit")}>Mark Submitted</button>}
          {item.status === "SUBMITTED" && <button type="button" disabled={busy} onClick={() => void update(item, "block")}>Mark Blocked</button>}
          {item.status === "BLOCKED" && <button type="button" disabled={busy} onClick={() => void update(item, "not-allotted")}>Not Allotted</button>}
          {item.status === "BLOCKED" && <AllotmentForm item={item} busy={busy} onSave={(quantity, actualCost) => void recordAllotment(item, quantity, actualCost)} />}
        </div>}
        <details className="application-history"><summary>History</summary><ol>
          {applicationHistory(item).map((event, index) => <li key={`${event.at}-${index}`}><time dateTime={event.at}>{displayTime(event.at)}</time><span>{event.label}</span></li>)}
        </ol></details>
      </article>)}
    </div>}
  </div></main>;
}
