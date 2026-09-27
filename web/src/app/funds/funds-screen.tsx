"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { balanceActionLabel, formatInr } from "@/lib/money";
import ScheduledPayments, { type ScheduledPayment } from "./scheduled-payments";

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
  operation: "ADD" | "REMOVE" | "SET" | "ALLOTMENT";
  amount: string;
  balance: string;
  note: string;
  created_at: string;
};
type Action = "add" | "remove" | "set";

export default function FundsScreen({
  workspace,
  investors,
  initialBanks,
  initialChanges,
  initialPayments,
}: {
  workspace: Workspace;
  investors: Investor[];
  initialBanks: Bank[];
  initialChanges: Change[];
  initialPayments: ScheduledPayment[];
}) {
  const [banks, setBanks] = useState(initialBanks);
  const [selectedBankId, setSelectedBankId] = useState(initialBanks[0]?.id ?? "");
  const [changes, setChanges] = useState(initialChanges);
  const [action, setAction] = useState<Action>("add");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ownerId, setOwnerId] = useState(investors[0]?.id ?? "");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedBank = banks.find((bank) => bank.id === selectedBankId);
  const canEdit = workspace.role !== "VIEWER";

  async function loadHistory(bankId: string) {
    const response = await fetch(`/api/workspaces/${workspace.id}/banks/${bankId}/balance-changes`);
    if (response.ok) setChanges((await response.json()) as Change[]);
  }

  async function createBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/banks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner: ownerId, bank_name: name, account_number: accountNumber, initial_balance: openingBalance }),
      });
      if (!response.ok) throw new Error("Could not add bank");
      const bank = (await response.json()) as Bank;
      setBanks([...banks, bank]);
      setSelectedBankId(bank.id);
      setName("");
      setAccountNumber("");
      setOpeningBalance("0");
      await loadHistory(bank.id);
      setMessage("Bank added.");
    } catch {
      setMessage("Check the bank details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function changeBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBank) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/banks/${selectedBank.id}/balance-changes/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error("Could not update balance");
      const result = (await response.json()) as { balance: string };
      setBanks(banks.map((bank) => bank.id === selectedBank.id ? { ...bank, current_balance: result.balance } : bank));
      setAmount("");
      await loadHistory(selectedBank.id);
      setMessage("Balance updated.");
    } catch {
      setMessage("Check the amount and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page settings-page">
      <div className="shell settings-shell">
        <p className="eyebrow">Funds</p>
        <h1>Bank balances</h1>
        <p className="intro">{workspace.name}</p>
        {banks.length > 0 && (
          <>
            <label htmlFor="bank-select">Bank account</label>
            <select id="bank-select" value={selectedBankId} onChange={(event) => { setSelectedBankId(event.target.value); void loadHistory(event.target.value); }}>
              {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.bank_name} {bank.account_masked}</option>)}
            </select>
            {selectedBank && (
              <>
                <p className="balance-card"><span>Balance</span><strong>{formatInr(selectedBank.current_balance)}</strong></p>
                {canEdit && (
                  <>
                    <div className="balance-actions" role="group" aria-label="Balance actions">
                      {(["add", "remove", "set"] as Action[]).map((item) => (
                        <button key={item} type="button" aria-pressed={action === item} onClick={() => setAction(item)}>
                          {balanceActionLabel(item.toUpperCase() as "ADD" | "REMOVE" | "SET")}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={changeBalance} className="sign-in-form">
                      <label htmlFor="balance-amount">Amount (₹)</label>
                      <input id="balance-amount" type="number" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} />
                      <button type="submit" disabled={busy}>{balanceActionLabel(action.toUpperCase() as "ADD" | "REMOVE" | "SET")}</button>
                    </form>
                  </>
                )}
                <h2>Recent changes</h2>
                {changes.length === 0 ? <p>No changes yet.</p> : (
                  <ul className="change-list">
                    {changes.map((change) => (
                      <li key={change.id}>
                        <span><strong>{balanceActionLabel(change.operation)}</strong><br /><small>{new Date(change.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small></span>
                        <span>{formatInr(change.amount)}<br /><small>Balance {formatInr(change.balance)}</small></span>
                      </li>
                    ))}
                  </ul>
                )}
                <ScheduledPayments
                  key={selectedBank.id}
                  workspaceId={workspace.id}
                  bankId={selectedBank.id}
                  canEdit={canEdit}
                  initialPayments={selectedBank.id === initialBanks[0]?.id ? initialPayments : []}
                />
              </>
            )}
          </>
        )}
        {canEdit && investors.length > 0 && (
          <form onSubmit={createBank} className="sign-in-form add-investor-form">
            <h2>Add bank</h2>
            <label htmlFor="bank-owner">Owner</label>
            <select id="bank-owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              {investors.map((investor) => <option key={investor.id} value={investor.id}>{investor.name}</option>)}
            </select>
            <label htmlFor="bank-name">Bank name</label>
            <input id="bank-name" required value={name} onChange={(event) => setName(event.target.value)} />
            <label htmlFor="account-number">Account number</label>
            <input id="account-number" required autoComplete="off" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
            <label htmlFor="opening-balance">Balance (₹)</label>
            <input id="opening-balance" type="number" step="0.01" required value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} />
            <button type="submit" disabled={busy}>Add bank</button>
          </form>
        )}
        {investors.length === 0 && <p>Add an investor before adding a bank.</p>}
        {message && <p role="status">{message}</p>}
        <p><Link href="/settings/investors">Investor settings</Link> · <Link href="/">Home</Link></p>
      </div>
    </main>
  );
}
