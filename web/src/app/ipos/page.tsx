import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { backendUrl } from "@/lib/backend";
import { formatInr } from "@/lib/money";
import ThresholdSetting from "./threshold-setting";
import IPOChoice, { type IPOSelection } from "./ipo-choice";

type IPO = {
  id: string;
  issuer_name: string;
  symbol: string;
  issue_type: string;
  upper_price: string;
  lot_size: number;
  open_date: string;
  close_date: string;
  status: string;
  current_gmp: string | null;
  current_gmp_percent: string | null;
  current_gmp_observed_at: string | null;
};

type Observation = {
  id: string;
  value_per_share: string;
  percent: string;
  observed_at: string;
  source_key: string;
};

type Workspace = { id: string; role: string; auto_select_gmp_percent: string | null };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function observedLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short",
  }).format(new Date(value));
}

function Trend({ history }: { history: Observation[] }) {
  const points = [...history].reverse();
  if (points.length < 2) return null;
  const values = points.map((item) => Number(item.value_per_share));
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const coordinates = values.map((value, index) => `${10 + (index * 280) / (values.length - 1)},${60 - ((value - low) / span) * 50}`).join(" ");
  return <svg className="gmp-trend" viewBox="0 0 300 70" role="img" aria-label="GMP history trend">
    <polyline points={coordinates} fill="none" stroke="#246143" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export default async function IPOsPage() {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader.includes("sessionid=")) redirect("/sign-in");
  const [response, workspaceResponse] = await Promise.all([
    fetch(backendUrl("ipos/"), { headers: { cookie: cookieHeader }, cache: "no-store" }),
    fetch(backendUrl("workspaces/"), { headers: { cookie: cookieHeader }, cache: "no-store" }),
  ]);
  if (!response.ok || !workspaceResponse.ok) redirect("/sign-in");
  const ipos = (await response.json()) as IPO[];
  const workspaces = (await workspaceResponse.json()) as Workspace[];
  const workspace = workspaces[0];
  let selections: IPOSelection[] = [];
  if (workspace) {
    const selectionResponse = await fetch(backendUrl(`workspaces/${workspace.id}/ipo-decisions/`), { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (selectionResponse.ok) selections = (await selectionResponse.json()) as IPOSelection[];
  }
  const histories = await Promise.all(ipos.map(async (ipo) => {
    const result = await fetch(backendUrl(`ipos/${ipo.id}/gmp-history/`), { headers: { cookie: cookieHeader }, cache: "no-store" });
    return result.ok ? ((await result.json()) as Observation[]) : [];
  }));

  return <main className="page settings-page">
    <div className="shell settings-shell">
      <p className="eyebrow">IPOs</p>
      <h1>IPO market watch</h1>
      <p className="intro">GMP is an observation, not a guarantee. Check when it was last updated.</p>
      {workspace && <ThresholdSetting workspaceId={workspace.id} initialValue={workspace.auto_select_gmp_percent} canEdit={workspace.role === "OWNER"} />}
      {ipos.length === 0 && <p>No published IPOs yet.</p>}
      <div className="ipo-list">
        {ipos.map((ipo, index) => <article className="ipo-card" key={ipo.id}>
          <div className="ipo-head"><div><h2>{ipo.issuer_name}</h2><small>{ipo.symbol || ipo.issue_type} · {ipo.status}</small></div><strong>{ipo.current_gmp === null ? "GMP unavailable" : `${formatInr(ipo.current_gmp)} · ${ipo.current_gmp_percent}%`}</strong></div>
          <p>Price up to {formatInr(ipo.upper_price)} per share · {ipo.lot_size} shares per lot</p>
          <p>Open {dateLabel(ipo.open_date)} · Close {dateLabel(ipo.close_date)}</p>
          {ipo.current_gmp_observed_at && <p><small>Latest GMP observed {observedLabel(ipo.current_gmp_observed_at)}</small></p>}
          <Trend history={histories[index]} />
          {workspace && <IPOChoice key={`${ipo.id}:${selections.find((item) => item.ipo === ipo.id)?.decision}:${selections.find((item) => item.ipo === ipo.id)?.selected}`} workspaceId={workspace.id} ipoId={ipo.id} initial={selections.find((item) => item.ipo === ipo.id)} canEdit={workspace.role !== "VIEWER"} />}
          <details><summary>GMP history ({histories[index].length})</summary>
            <ol className="gmp-history">{histories[index].map((item) => <li key={item.id}>
              <span>{observedLabel(item.observed_at)} · {item.source_key}</span>
              <strong>{formatInr(item.value_per_share)} · {item.percent}%</strong>
            </li>)}</ol>
          </details>
        </article>)}
      </div>
      {workspace && <p><Link className="button-link" href="/plan">Review plan</Link></p>}
      <p><Link href="/">Home</Link></p>
    </div>
  </main>;
}
