import { getApiHealth } from "@/lib/api-health";
import Link from "next/link";
import { backendApiBaseUrl } from "@/lib/backend";
import { getCurrentUser } from "@/lib/session";
import SignOutButton from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [health, user] = await Promise.all([
    getApiHealth(backendApiBaseUrl),
    getCurrentUser(),
  ]);

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">LotNeeti</p>
        <h1>IPO planning for your family or group</h1>
        <p className="intro">Your workspace is being prepared.</p>
        {user ? (
          <div className="account-state">
            <p>Signed in as {user.email}</p>
            <p><Link href="/settings/investors">Investor settings</Link></p>
            <p><Link href="/funds">Funds</Link></p>
            <p><Link href="/ipos">IPOs</Link></p>
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
