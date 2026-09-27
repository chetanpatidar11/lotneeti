import { getApiHealth } from "@/lib/api-health";
import Link from "next/link";
import { backendApiBaseUrl, backendUrl } from "@/lib/backend";
import { formatInr } from "@/lib/money";
import { getCurrentUser } from "@/lib/session";
import { cookies } from "next/headers";
import SignOutButton from "./sign-out-button";

export const dynamic = "force-dynamic";

type Capital = { balance: string; blocked: string; planned: string; available: string };
type Operations = { active_ipos: number; applications: number; pending_mandates: number; allotment_wins: number; realized_gains: string };

async function getHomeStats(): Promise<{ capital: Capital | null; operations: Operations | null }> {
  try {
    const cookieHeader = (await cookies()).toString();
    const workspaces = await fetch(backendUrl("workspaces/"), { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!workspaces.ok) return { capital: null, operations: null };
    const items = await workspaces.json() as { id: string }[];
    if (!items[0]) return { capital: null, operations: null };
    const [capitalResponse, operationsResponse] = await Promise.all([
      fetch(backendUrl(`workspaces/${items[0].id}/capital/`), { headers: { cookie: cookieHeader }, cache: "no-store" }),
      fetch(backendUrl(`workspaces/${items[0].id}/operations/`), { headers: { cookie: cookieHeader }, cache: "no-store" }),
    ]);
    return {
      capital: capitalResponse.ok ? (await capitalResponse.json() as Capital) : null,
      operations: operationsResponse.ok ? (await operationsResponse.json() as Operations) : null,
    };
  } catch {
    return { capital: null, operations: null };
  }
}

export default async function HomePage() {
  const [health, user] = await Promise.all([
    getApiHealth(backendApiBaseUrl),
    getCurrentUser(),
  ]);
  const { capital, operations } = user ? await getHomeStats() : { capital: null, operations: null };

  return (
    <main className="page">
      <div className="shell home-shell">
        <p className="eyebrow">LotNeeti</p>
        <h1>IPO planning for your family or group</h1>
        <p className="intro">Your IPO money at a glance.</p>
        {capital && <section className="capital-grid" aria-label="Money overview">
          <div><span>Balance</span><strong>{formatInr(capital.balance)}</strong><small>Across your banks</small></div>
          <div><span>Blocked</span><strong>{formatInr(capital.blocked)}</strong><small>In active mandates</small></div>
          <div><span>Planned</span><strong>{formatInr(capital.planned)}</strong><small>In your latest saved plan</small></div>
          <div><span>Available</span><strong>{formatInr(capital.available)}</strong><small>Free across your banks</small></div>
        </section>}
        {operations && <section className="operations-grid" aria-label="Activity overview">
          <div><span>Active IPOs</span><strong>{operations.active_ipos}</strong><small><Link href="/ipos">Open issues</Link></small></div>
          <div><span>Applications</span><strong>{operations.applications}</strong><small><Link href="/applications">Tracked applications</Link></small></div>
          <div><span>Pending Mandates</span><strong>{operations.pending_mandates}</strong><small>Submitted, awaiting block</small></div>
          <div><span>Allotment Wins</span><strong>{operations.allotment_wins}</strong><small>Allotted applications</small></div>
          <div><span>Realized Gains</span><strong>{Number(operations.realized_gains) >= 0 ? "+" : ""}{formatInr(operations.realized_gains)}</strong><small><Link href="/portfolio">Recorded sales</Link></small></div>
        </section>}
        {user ? (
          <div className="account-state">
            <p>Signed in as {user.email}</p>
            <p><Link href="/settings/investors">Investor settings</Link></p>
            <p><Link href="/funds">Funds</Link></p>
            <p><Link href="/ipos">IPOs</Link></p>
            <p><Link href="/plan">Plan</Link></p>
            <SignOutButton />
          </div>
        ) : (
          <Link className="button-link" href="/sign-in">Sign in</Link>
        )}
        <p className={health.connected ? "status connected" : "status"} role="status">
          <span aria-hidden="true" className="status-dot" />
          {health.message}
        </p>
      </div>
    </main>
  );
}
