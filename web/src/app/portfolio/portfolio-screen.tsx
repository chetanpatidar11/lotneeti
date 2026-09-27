"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatInr } from "@/lib/money";

export type AllottedApplication = {
  id: string;
  ipo_name: string;
  applicant_name: string;
  status: string;
  allotted_quantity: number | null;
};

export type SaleItem = {
  id: string;
  application: string;
  ipo_name: string;
  applicant_name: string;
  quantity: number;
  price_per_share: string;
  sold_on: string;
  charges: string;
  gross_proceeds: string;
  ipo_cost: string;
  realized_profit: string;
  roi_percent: string | null;
};

type ProfitTotals = {
  gross_proceeds: string;
  ipo_cost: string;
  charges: string;
  realized_profit: string;
  roi_percent: string | null;
};

export type ProfitReport = {
  sale_count: number;
  workspace: ProfitTotals;
  by_ipo: (ProfitTotals & { id: string; name: string })[];
  by_investor: (ProfitTotals & { id: string; name: string })[];
};

function ProfitLine({ label, totals }: { label: string; totals: ProfitTotals }) {
  return <div className="profit-line"><strong>{label}</strong><span>Sale amount {formatInr(totals.gross_proceeds)}</span><span>IPO cost {formatInr(totals.ipo_cost)}</span><span>Charges {formatInr(totals.charges)}</span><span>Realized profit {formatInr(totals.realized_profit)}</span><span>ROI {totals.roi_percent === null ? "—" : `${totals.roi_percent}%`}</span></div>;
}

function remaining(application: AllottedApplication, sales: SaleItem[]): number {
  return (application.allotted_quantity ?? 0) - sales.filter((sale) => sale.application === application.id).reduce((sum, sale) => sum + sale.quantity, 0);
}

export default function PortfolioScreen({ workspaceId, canEdit, initialApplications, initialSales, report, fromDate, toDate }: {
  workspaceId: string;
  canEdit: boolean;
  initialApplications: AllottedApplication[];
  initialSales: SaleItem[];
  report: ProfitReport | null;
  fromDate: string;
  toDate: string;
}) {
  const router = useRouter();
  const [sales, setSales] = useState(initialSales);
  const [applicationId, setApplicationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [soldOn, setSoldOn] = useState("");
  const [charges, setCharges] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const available = initialApplications.filter((item) => item.status === "ALLOTTED" && remaining(item, sales) > 0);
  const selected = available.find((item) => item.id === applicationId);

  async function record(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/sales`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ application: applicationId, quantity: Number(quantity), price_per_share: price, sold_on: soldOn, charges: charges || "0.00" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "We could not record this sale.");
      setSales((current) => [result as SaleItem, ...current]);
      router.refresh();
      setQuantity("");
      setPrice("");
      setCharges("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not record this sale.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="page settings-page"><div className="shell settings-shell">
    <p className="eyebrow">Portfolio</p>
    <h1>Sales</h1>
    <p className="intro">Record sales of allotted shares. <Link href="/applications">View applications</Link></p>
    {canEdit && available.length > 0 && <form className="sale-form" onSubmit={(event) => void record(event)}>
      <h2>Record sale</h2>
      <label>Allotted application<select required value={applicationId} onChange={(event) => setApplicationId(event.target.value)}><option value="">Choose application</option>{available.map((item) => <option key={item.id} value={item.id}>{item.ipo_name} · {item.applicant_name} · {remaining(item, sales)} shares left</option>)}</select></label>
      <label>Shares sold<input required type="number" min="1" max={selected ? remaining(selected, sales) : undefined} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      <label>Price per share (₹)<input required type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label>Sale date<input required type="date" value={soldOn} onChange={(event) => setSoldOn(event.target.value)} /></label>
      <label>Charges (₹, optional)<input type="number" min="0" step="0.01" value={charges} onChange={(event) => setCharges(event.target.value)} /></label>
      <button type="submit" disabled={busy || !selected}>Record sale</button>
    </form>}
    {error && <p role="alert" className="plan-error">{error}</p>}
    <section className="profit-report" aria-label="Realized profit summary">
      <h2>Realized profit</h2>
      <form method="get" action="/portfolio" className="profit-period"><label>From<input type="date" name="from_date" defaultValue={fromDate} /></label><label>To<input type="date" name="to_date" defaultValue={toDate} /></label><button type="submit">Show period</button><Link href="/portfolio">All dates</Link></form>
      {report ? <>
        <p>{report.sale_count} {report.sale_count === 1 ? "sale" : "sales"} in this period</p>
        <ProfitLine label="Workspace total" totals={report.workspace} />
        {report.by_ipo.length > 0 && <><h3>By IPO</h3>{report.by_ipo.map((item) => <ProfitLine key={item.id} label={item.name} totals={item} />)}</>}
        {report.by_investor.length > 0 && <><h3>By investor</h3>{report.by_investor.map((item) => <ProfitLine key={item.id} label={item.name} totals={item} />)}</>}
      </> : <p role="alert">We could not load this profit period. Check the dates and try again.</p>}
    </section>
    <h2>Recorded sales</h2>
    {sales.length === 0 ? <p>No sales recorded yet.</p> : <div className="sale-list">{sales.map((sale) => <article key={sale.id} className="sale-card"><strong>{sale.ipo_name}</strong><span>{sale.applicant_name} · {sale.quantity} shares · {formatInr(sale.price_per_share)} each</span><span>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${sale.sold_on}T12:00:00`))}</span><span>Sale amount: {formatInr(sale.gross_proceeds)}</span><span>IPO cost: {formatInr(sale.ipo_cost)}</span><span>Charges: {formatInr(sale.charges)}</span><strong>Realized profit: {formatInr(sale.realized_profit)} · ROI: {sale.roi_percent === null ? "—" : `${sale.roi_percent}%`}</strong></article>)}</div>}
  </div></main>;
}
