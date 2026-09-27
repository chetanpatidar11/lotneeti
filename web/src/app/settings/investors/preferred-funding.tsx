"use client";

import { FormEvent, useState } from "react";

export type BankOption = {
  id: string;
  owner: string;
  bank_name: string;
  account_masked: string;
  active: boolean;
};

export type FundingPreference = {
  id: string;
  bank: string;
  priority: number;
  enabled: boolean;
};

type InvestorOption = { id: string; name: string };

function ordered(items: FundingPreference[]) {
  return [...items].sort((a, b) => a.priority - b.priority || a.bank.localeCompare(b.bank));
}

export default function PreferredFunding({
  workspaceId,
  investor,
  investors,
  banks,
  initialPreferences,
  canEdit,
}: {
  workspaceId: string;
  investor: InvestorOption;
  investors: InvestorOption[];
  banks: BankOption[];
  initialPreferences: FundingPreference[];
  canEdit: boolean;
}) {
  const [preferences, setPreferences] = useState(ordered(initialPreferences));
  const [selectedBank, setSelectedBank] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const base = `/api/workspaces/${workspaceId}/investors/${investor.id}/funding-preferences`;
  const ownBanks = banks.filter((bank) => bank.owner === investor.id && bank.active);
  const available = banks.filter((bank) => bank.owner !== investor.id && bank.active && !preferences.some((item) => item.bank === bank.id));

  function bankLabel(bank: BankOption) {
    return `${investors.find((person) => person.id === bank.owner)?.name ?? "Investor"} · ${bank.bank_name} ${bank.account_masked}`;
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBank) return;
    setBusy(true);
    try {
      const response = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bank: selectedBank, priority: Math.max(0, ...preferences.map((item) => item.priority)) + 1 }),
      });
      if (!response.ok) throw new Error("Save failed");
      setPreferences(ordered([...preferences, (await response.json()) as FundingPreference]));
      setSelectedBank("");
      setMessage("Preferred account added.");
    } catch {
      setMessage("We could not add this account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, changes: Partial<FundingPreference>) {
    setBusy(true);
    try {
      const response = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error("Save failed");
      const saved = (await response.json()) as FundingPreference;
      setPreferences((current) => ordered(current.map((item) => item.id === id ? saved : item)));
      setMessage("Preferred accounts saved.");
    } catch {
      setMessage("We could not save this account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`${base}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setPreferences((current) => current.filter((item) => item.id !== id));
      setMessage("Preferred account removed.");
    } catch {
      setMessage("We could not remove this account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="preferred-funding" aria-label={`Preferred funding accounts for ${investor.name}`}>
      <h3>Preferred funding accounts</h3>
      <p>Own available account comes first. These other accounts follow in priority order when allowed.</p>
      {ownBanks.map((bank) => <p key={bank.id}>{bankLabel(bank)} <small>Own account · default</small></p>)}
      <ul className="preference-list">
        {preferences.map((item) => {
          const bank = banks.find((option) => option.id === item.bank);
          return <li key={item.id}>
            <span>{bank ? bankLabel(bank) : "Account unavailable"}</span>
            <label>Priority
              <input
                type="number"
                min="1"
                value={item.priority}
                disabled={!canEdit || busy}
                onChange={(event) => setPreferences((current) => current.map((preference) => preference.id === item.id ? { ...preference, priority: Number(event.target.value) } : preference))}
              />
            </label>
            {canEdit && <>
              <button type="button" disabled={busy || item.priority < 1} onClick={() => update(item.id, { priority: item.priority })}>Save priority</button>
              <label className="preference-enabled"><input type="checkbox" checked={item.enabled} disabled={busy} onChange={(event) => update(item.id, { enabled: event.target.checked })} /> Enabled</label>
              <button type="button" disabled={busy} onClick={() => remove(item.id)}>Remove</button>
            </>}
          </li>;
        })}
      </ul>
      {canEdit && available.length > 0 && <form onSubmit={add} className="preference-add">
        <label>Other account
          <select value={selectedBank} onChange={(event) => setSelectedBank(event.target.value)} required>
            <option value="">Choose account</option>
            {available.map((bank) => <option key={bank.id} value={bank.id}>{bankLabel(bank)}</option>)}
          </select>
        </label>
        <button type="submit" disabled={busy || !selectedBank}>Add preferred account</button>
      </form>}
      <p><small>Other allowed accounts remain available if preferred accounts cannot be used.</small></p>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
