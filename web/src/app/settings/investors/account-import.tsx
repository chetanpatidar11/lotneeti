"use client";

import { ChangeEvent, useState } from "react";

type ImportRow = {
  row_number: number;
  name: string;
  pan_masked: string;
  type: string;
  dpid_masked: string;
  client_id_masked: string;
  upi_masked: string;
  account_masked: string;
  bank_name: string;
  errors: string[];
};

type ImportPreview = {
  id: string;
  status: "PREVIEWED" | "CONFIRMED";
  source_filename: string;
  row_count: number;
  error_count: number;
  rows: ImportRow[];
};

export default function AccountImport({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/account-imports`, { method: "POST", body });
      if (!response.ok) throw new Error("Import failed");
      const data = await response.json() as ImportPreview;
      setPreview(data);
      setSelected(data.rows.filter((row) => row.errors.length === 0).map((row) => row.row_number));
      setMessage("Review the rows before importing them.");
    } catch {
      setMessage("We could not read that workbook. Check the template and try again.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function toggle(rowNumber: number) {
    setSelected((current) => current.includes(rowNumber) ? current.filter((item) => item !== rowNumber) : [...current, rowNumber]);
  }

  async function confirm() {
    if (!preview || selected.length === 0) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/account-imports/${preview.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ row_numbers: selected }),
      });
      if (!response.ok) throw new Error("Import failed");
      const data = await response.json() as { imported_rows: number };
      setMessage(`${data.imported_rows} row(s) imported. Set each bank Balance before planning.`);
      setPreview({ ...preview, status: "CONFIRMED" });
    } catch {
      setMessage("The selected rows could not be imported. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="account-import" aria-labelledby="account-import-heading">
    <h2 id="account-import-heading">Import accounts</h2>
    <p>Use the AccountImportTemplate.xlsx column format. Each PAN may appear only once in a workbook. Values are masked in this review; only checked valid rows are saved.</p>
    {canEdit && <label className="file-picker">Choose workbook
      <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={upload} />
    </label>}
    {preview && <>
      <p><strong>{preview.source_filename}</strong> · {preview.row_count} row(s), {preview.error_count} with errors</p>
      <div className="plan-table-wrap">
        <table className="plan-table account-import-table">
          <caption>Review import rows</caption>
          <thead><tr><th>Import</th><th>Name</th><th>PAN</th><th>Demat</th><th>UPI</th><th>Bank account</th><th>Status</th></tr></thead>
          <tbody>{preview.rows.map((row) => <tr key={row.row_number}>
            <td data-label="Import"><input type="checkbox" aria-label={`Import row ${row.row_number}`} checked={selected.includes(row.row_number)} disabled={!canEdit || preview.status === "CONFIRMED" || row.errors.length > 0} onChange={() => toggle(row.row_number)} /></td>
            <td data-label="Name">{row.name}</td>
            <td data-label="PAN">{row.pan_masked}</td>
            <td data-label="Demat">{row.type} · {row.dpid_masked} · {row.client_id_masked}</td>
            <td data-label="UPI">{row.upi_masked}</td>
            <td data-label="Bank account">{row.bank_name} · {row.account_masked}</td>
            <td data-label="Status">{row.errors.length ? <ul>{row.errors.map((error) => <li key={error}>{error}</li>)}</ul> : "Ready"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {canEdit && preview.status === "PREVIEWED" && <button type="button" disabled={busy || selected.length === 0} onClick={() => void confirm()}>Confirm selected rows</button>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
