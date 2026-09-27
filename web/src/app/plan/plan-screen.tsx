"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { formatInr } from "@/lib/money";
import { amountForLots, minimumShniLots, sumAmounts } from "@/lib/plan-amount";
import { bankReasonSummary, canExportPlan, fundingLabel, issueMessage, lockedMappings, planStatus, rankedBanks, reviewedMappings, rowIssueMessages, rowStatus, selectableApplicants, selectableDemats, selectableUpis, type BankLookup, type DematLookup, type FundingPreference, type PlanPreview, type PlanRow, type UpiLookup } from "@/lib/plan-presentation";

export type PlanLookups = {
  ipos: Record<string, { name: string; upperPrice: string; lotSize: number }>;
  applicants: Record<string, { name: string; priority: number; active: boolean }>;
  demats: Record<string, DematLookup>;
  banks: Record<string, BankLookup>;
  upis: Record<string, UpiLookup>;
  preferences: Record<string, FundingPreference[]>;
  selectedIpos: { ipo: string; mode: string }[];
  capital: { balance: string; blocked: string; planned: string; available: string } | null;
};

export default function PlanScreen({ workspaceId, lookups }: {
  workspaceId: string;
  lookups: PlanLookups;
}) {
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef<PlanPreview | null>(null);
  const validationSequence = useRef(0);

  function showPreview(next: PlanPreview) {
    previewRef.current = next;
    setPreview(next);
  }

  async function generate() {
    validationSequence.current += 1;
    setValidating(false);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/planner/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locked_rows: lockedMappings(previewRef.current?.rows ?? []) }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || result.message || "We could not create the plan.");
      }
      showPreview(result as PlanPreview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not create the plan.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRow(index: number, changes: Partial<Pick<PlanRow, "applicant" | "category" | "lots" | "demat" | "bank" | "upi" | "locked">>) {
    const current = previewRef.current;
    const previous = current?.rows[index];
    if (!previous) return;
    const lots = changes.lots ?? previous.lots;
    if (!current || !Number.isSafeInteger(lots) || lots < 1) return;
    if (previous.locked && changes.locked !== false) return;
    const ipo = lookups.ipos[previous.ipo];
    if (!ipo) {
      setError("IPO quote details are unavailable. Refresh the page and try again.");
      return;
    }
    const nextRows = [...current.rows];
    nextRows[index] = {
      ...previous,
      ...changes,
      amount: changes.category || changes.lots ? amountForLots(ipo.upperPrice, ipo.lotSize, lots) : previous.amount,
      blocking_reasons: [],
      warnings: changes.bank || changes.applicant ? (lookups.banks[changes.bank ?? previous.bank]?.owner === (changes.applicant ?? previous.applicant) ? [] : ["CROSS_FUNDING"]) : previous.warnings,
    };
    showPreview({ ...current, rows: nextRows, planned_total: sumAmounts(nextRows.map((row) => row.amount)) });
    setValidating(true);
    setError("");
    const sequence = ++validationSequence.current;
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/planner/validate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: nextRows.map((row) => ({
          ipo: row.ipo,
          applicant: row.applicant,
          category: row.category,
          lots: row.lots,
          amount: row.amount,
          demat: row.demat,
          bank: row.bank,
          upi: row.upi,
          locked: row.locked,
        })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "We could not check this change.");
      if (sequence === validationSequence.current) {
        showPreview({ ...result as PlanPreview, uncovered: current.uncovered });
      }
    } catch (caught) {
      if (sequence === validationSequence.current) {
        setError(caught instanceof Error ? caught.message : "We could not check this change.");
      }
    } finally {
      if (sequence === validationSequence.current) setValidating(false);
    }
  }

  async function exportCsv() {
    const current = previewRef.current;
    if (!current || !canExportPlan(current) || validating || busy) return;
    setBusy(true);
    setError("");
    try {
      const savedResponse = await fetch(`/api/workspaces/${workspaceId}/planner/runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: reviewedMappings(current.rows) }),
      });
      const saved = await savedResponse.json();
      if (!savedResponse.ok) throw new Error(saved.detail || saved.message || "We could not save this plan.");
      if (saved.status !== "READY") {
        showPreview({ ...saved as PlanPreview, uncovered: current.uncovered });
        throw new Error("The plan changed. Resolve the blocking issues before export.");
      }
      const exportResponse = await fetch(`/api/workspaces/${workspaceId}/planner/runs/${saved.id}/exports`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format_id: "generic_csv" }),
      });
      const exportRecord = await exportResponse.json();
      if (!exportResponse.ok) throw new Error(exportRecord.detail || "We could not export this plan.");
      const downloadResponse = await fetch(`/api/workspaces/${workspaceId}/planner/runs/${saved.id}/exports/${exportRecord.id}/download`);
      const download = await downloadResponse.json();
      if (!downloadResponse.ok) throw new Error(download.detail || "We could not prepare the download.");
      window.location.assign(download.download_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not export this plan.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="page settings-page">
    <div className="shell plan-shell">
      <p className="eyebrow">Plan</p>
      <h1>Review your IPO plan</h1>
      <p className="intro">Generate a draft from your selected IPOs and current account details. Check each application before using it.</p>
      <div className="plan-creation-grid">
        <section className="plan-context-card" aria-labelledby="selected-ipos-heading">
          <h2 id="selected-ipos-heading">Selected IPOs</h2>
          {lookups.selectedIpos.length === 0 ? <p>No IPOs selected yet. Choose an IPO to plan applications.</p> : <ul>
            {lookups.selectedIpos.map((selection) => <li key={selection.ipo}>
              <strong>{lookups.ipos[selection.ipo]?.name || "Selected IPO"}</strong>
              <span>{selection.mode === "RETAIL_ONLY" ? "Retail Only" : selection.mode === "RETAIL_PLUS_SHNI" ? "Retail + sHNI" : selection.mode === "SHNI_PREFERRED" ? "sHNI Preferred" : "Custom"}</span>
            </li>)}
          </ul>}
          <Link href="/ipos">Change selected IPOs and modes</Link>
        </section>
        <section className="plan-context-card" aria-labelledby="capital-heading">
          <h2 id="capital-heading">Money available for planning</h2>
          {lookups.capital ? <div className="plan-context-totals">
            <p><span>Balance</span><strong>{formatInr(lookups.capital.balance)}</strong></p>
            <p><span>Blocked</span><strong>{formatInr(lookups.capital.blocked)}</strong></p>
            <p><span>Planned</span><strong>{formatInr(lookups.capital.planned)}</strong></p>
            <p><span>Available</span><strong>{formatInr(lookups.capital.available)}</strong></p>
          </div> : <p>Add a bank and set its Balance to see your money here.</p>}
          <p className="plan-context-help">The planner starts with one Retail application for each eligible applicant, then considers sHNI according to each IPO mode.</p>
        </section>
      </div>
      <div className="plan-toolbar">
        <button type="button" onClick={generate} disabled={busy || validating}>{busy ? "Creating plan…" : preview ? "Re-plan unlocked rows" : "Generate Plan"}</button>
        {preview && <button type="button" onClick={() => void exportCsv()} disabled={busy || validating || !canExportPlan(preview)}>{busy ? "Preparing…" : "Export CSV"}</button>}
        <Link href="/ipos">Review selected IPOs</Link>
      </div>
      {error && <p className="plan-error" role="alert">{error}</p>}
      {validating && <p role="status">Checking your changes…</p>}
      {preview && <section aria-live="polite">
        <div className="plan-summary">
          <div><span>Planned</span><strong>{formatInr(preview.planned_total)}</strong></div>
          <div><span>Applications</span><strong>{preview.rows.length}</strong></div>
          <div><span>Status</span><strong>{validating ? "Checking" : planStatus(preview)}</strong></div>
        </div>
        {!validating && <p className="plan-note" role="status">{canExportPlan(preview) ? "Ready to export. Review any warnings before using this plan." : "⚠ Blocking: Resolve issues before export."}</p>}
        {preview.audit_issues.length > 0 && <div className="plan-error" role="alert">
          <strong>⚠ Blocking: Resolve these issues before export</strong>
          <ul>{preview.audit_issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issueMessage(issue.code)}</li>)}</ul>
        </div>}
        {preview.uncovered.length > 0 && <p className="plan-note">{preview.uncovered.length} applicant/IPO {preview.uncovered.length === 1 ? "pair" : "pairs"} could not be planned.</p>}
        {preview.rows.length === 0 ? <p className="plan-empty">No applications are in this draft. Select an IPO and check your investors, banks and UPIs.</p> : <div className="plan-table-wrap">
          <table className="plan-table">
            <caption>Draft applications</caption>
            <thead><tr><th>IPO</th><th>Applicant</th><th>Category</th><th>Lots / Amount</th><th>Demat</th><th>Bank</th><th>UPI</th><th>Funding</th><th>Status</th><th>Lock</th></tr></thead>
            <tbody>{preview.rows.map((row, index) => <tr key={`${row.ipo}:${row.applicant}:${index}`}>
              <td data-label="IPO">{lookups.ipos[row.ipo]?.name || "Selected IPO"}</td>
              <td data-label="Applicant"><select aria-label={`Applicant for ${lookups.ipos[row.ipo]?.name || "IPO"}`} value={row.applicant} disabled={row.locked || busy} onChange={(event) => void updateRow(index, { applicant: event.target.value })}>
                {!lookups.applicants[row.applicant]?.active && <option value={row.applicant} disabled>Current applicant unavailable</option>}
                {selectableApplicants(lookups.applicants).map((applicant) => <option key={applicant.id} value={applicant.id}>{applicant.name} · Priority {applicant.priority}</option>)}
              </select><small>Choose this applicant&apos;s demat if you change the name.</small></td>
              <td data-label="Category"><select aria-label={`Category for ${lookups.applicants[row.applicant]?.name || "applicant"}`} value={row.category} disabled={row.locked || busy} onChange={(event) => {
                const category = event.target.value as "RETAIL" | "SHNI";
                const ipo = lookups.ipos[row.ipo];
                if (!ipo) return;
                const lots = category === "RETAIL" ? 1 : minimumShniLots(ipo.upperPrice, ipo.lotSize);
                void updateRow(index, { category, lots });
              }}><option value="RETAIL">Retail</option><option value="SHNI">sHNI</option></select></td>
              <td data-label="Lots / Amount"><input aria-label={`Lots for ${lookups.applicants[row.applicant]?.name || "applicant"}`} type="number" min={row.category === "RETAIL" ? 1 : lookups.ipos[row.ipo] ? minimumShniLots(lookups.ipos[row.ipo].upperPrice, lookups.ipos[row.ipo].lotSize) : 1} step="1" value={row.lots} disabled={row.locked || row.category === "RETAIL" || busy} onChange={(event) => {
                const lots = Number(event.target.value);
                if (Number.isSafeInteger(lots) && lots >= 1) void updateRow(index, { lots });
              }} /><small>{formatInr(row.amount)}</small></td>
              <td data-label="Demat"><select aria-label={`Demat for ${lookups.applicants[row.applicant]?.name || "applicant"}`} value={row.demat} disabled={row.locked || busy} onChange={(event) => void updateRow(index, { demat: event.target.value })}>
                {!selectableDemats(lookups.demats, row.applicant).some((demat) => demat.id === row.demat) && <option value={row.demat} disabled>Current demat unavailable</option>}
                {selectableDemats(lookups.demats, row.applicant).map((demat) => <option key={demat.id} value={demat.id}>{demat.label}</option>)}
              </select></td>
              <td data-label="Bank"><select aria-label={`Bank for ${lookups.applicants[row.applicant]?.name || "applicant"}`} value={row.bank} disabled={row.locked || busy} onChange={(event) => {
                const bank = event.target.value;
                const firstUpi = selectableUpis(lookups.upis, bank, row.applicant)[0];
                if (firstUpi) void updateRow(index, { bank, upi: firstUpi.id });
              }}>
                {!lookups.banks[row.bank] && <option value={row.bank} disabled>Current bank unavailable</option>}
                {rankedBanks(lookups.banks, lookups.upis, lookups.preferences[row.applicant] ?? [], row.applicant).map((option) => <option key={option.id} value={option.id} disabled={option.disabled}>{option.group}: {lookups.banks[option.id].label} · {formatInr(lookups.banks[option.id].balance)}{option.disabled ? " · unavailable" : ""}</option>)}
              </select>{bankReasonSummary(row).length > 0 && <details className="bank-explanation"><summary>Why this bank?</summary><ul>{bankReasonSummary(row).map((reason) => <li key={reason}>{reason}</li>)}</ul></details>}</td>
              <td data-label="UPI"><select aria-label={`UPI for ${lookups.applicants[row.applicant]?.name || "applicant"}`} value={row.upi} disabled={row.locked || busy} onChange={(event) => void updateRow(index, { upi: event.target.value })}>
                {!selectableUpis(lookups.upis, row.bank, row.applicant).some((upi) => upi.id === row.upi) && <option value={row.upi} disabled>Current UPI unavailable</option>}
                {selectableUpis(lookups.upis, row.bank, row.applicant).map((upi) => <option key={upi.id} value={upi.id}>{upi.label}</option>)}
              </select></td>
              <td data-label="Funding">{fundingLabel(row)}</td>
              <td data-label="Status"><span className={`plan-status ${rowStatus(row).toLowerCase()}`}>{rowStatus(row) === "Ready" ? "✓ Ready" : `⚠ ${rowStatus(row)}`}</span>{rowIssueMessages(row).map((message, messageIndex) => <small key={`${message}-${messageIndex}`}>{message}</small>)}</td>
              <td data-label="Lock"><button type="button" disabled={busy || validating} aria-label={`${row.locked ? "Unlock" : "Lock"} ${lookups.applicants[row.applicant]?.name || "applicant"} for ${lookups.ipos[row.ipo]?.name || "IPO"}`} onClick={() => void updateRow(index, { locked: !row.locked })}>{row.locked ? "Unlock" : "Lock"}</button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>}
      <p><Link href="/">Home</Link></p>
    </div>
  </main>;
}
