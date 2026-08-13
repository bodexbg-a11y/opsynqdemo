import { CheckCircle2, AlertTriangle, PlugZap } from "lucide-react";
import { getFacebookToken, explainGraphError, GRAPH_VERSION } from "@/lib/facebook/client";
import { fetchTokenIdentity, fetchAdAccounts, ACCOUNT_STATUS } from "@/lib/facebook/marketing";
import { updateFacebookTokenAction } from "@/lib/actions-settings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormField, inputClass } from "@/components/ui/form";

/**
 * Live connection panel — runs a real Graph API call on render so the exact
 * Meta error is visible in the UI rather than buried in server logs.
 */
export async function FacebookConnection() {
  const token = await getFacebookToken();

  if (!token) {
    return (
      <Card className="p-6 max-w-3xl">
        <Header connected={false} />
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-[12.5px] text-ink-600">
          No access token saved. Paste a Meta Marketing API token below, or set{" "}
          <code className="text-[11.5px] bg-white border border-ink-200 rounded px-1 py-0.5">FACEBOOK_ACCESS_TOKEN</code> in the
          environment. Until then, the Marketing page shows sample data.
        </div>
        <TokenForm hasToken={false} />
        <Requirements />
      </Card>
    );
  }

  const [identity, accounts] = await Promise.all([fetchTokenIdentity(token), fetchAdAccounts(token)]);
  const failed = !identity.ok ? identity.error : !accounts.ok ? accounts.error : null;

  return (
    <Card className="p-6 max-w-3xl">
      <Header connected={!failed} />

      {failed ? (
        <div className="mt-4 rounded-xl bg-danger-100 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-danger-500">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Facebook rejected the request
          </p>
          <p className="text-[12.5px] text-danger-500 mt-1.5">{failed.message}</p>
          <p className="text-[12px] text-ink-600 mt-2">{explainGraphError(failed)}</p>
          <p className="text-[11px] text-ink-400 mt-2 font-mono">
            {[
              failed.code !== undefined && `code ${failed.code}`,
              failed.error_subcode !== undefined && `subcode ${failed.error_subcode}`,
              failed.status !== undefined && `HTTP ${failed.status}`,
              failed.type,
              failed.fbtrace_id && `trace ${failed.fbtrace_id}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-success-100 px-4 py-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-success-500">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Connected as {identity.ok ? identity.data.name || identity.data.id : "unknown"}
            </p>
            <p className="text-[12px] text-ink-600 mt-1">
              {accounts.ok ? accounts.data.length : 0} ad account
              {accounts.ok && accounts.data.length === 1 ? "" : "s"} visible to this token · Graph API {GRAPH_VERSION}
            </p>
          </div>

          {accounts.ok && accounts.data.length > 0 && (
            <div className="rounded-xl border border-ink-100 overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide bg-ink-50/60">
                    <th className="px-4 py-2.5 font-medium">Ad Account</th>
                    <th className="px-4 py-2.5 font-medium">ID</th>
                    <th className="px-4 py-2.5 font-medium">Currency</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.data.map((a) => (
                    <tr key={a.id} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-ink-800">
                        {a.name}
                        {a.business_name && <span className="text-ink-400 font-normal"> · {a.business_name}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-ink-500 font-mono text-[11.5px]">{a.account_id}</td>
                      <td className="px-4 py-2.5 text-ink-600">{a.currency}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={a.account_status === 1 ? "success" : "warning"}>
                          {ACCOUNT_STATUS[a.account_status] ?? `Status ${a.account_status}`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {accounts.ok && accounts.data.length === 0 && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-100 px-4 py-3 text-[12.5px] text-ink-700">
              The token is valid but no ad accounts are visible. Make sure the token was generated with{" "}
              <code className="text-[11.5px]">ads_read</code> and that the user has access to an ad account in Business Manager.
            </div>
          )}
        </div>
      )}

      <TokenForm hasToken />
      <Requirements />
    </Card>
  );
}

function Header({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-[#1877F2] text-white flex items-center justify-center text-[16px] font-bold">f</span>
        <div>
          <h3 className="text-[14px] font-semibold text-ink-900">Facebook / Meta Ads</h3>
          <p className="text-[12px] text-ink-400 mt-0.5">Live campaign performance, ad sets, ads and leads</p>
        </div>
      </div>
      <Badge variant={connected ? "success" : "neutral"}>
        <PlugZap className="w-3 h-3" />
        {connected ? "Connected" : "Not connected"}
      </Badge>
    </div>
  );
}

function TokenForm({ hasToken }: { hasToken: boolean }) {
  return (
    <form action={updateFacebookTokenAction} className="mt-5 space-y-3">
      <FormField
        label="Access Token"
        hint={
          hasToken
            ? "A token is saved. Paste a new one to replace it — leaving this blank keeps the current token."
            : "Generate at developers.facebook.com → your app → Graph API Explorer, with the ads_read permission."
        }
      >
        <input
          name="facebookAccessToken"
          type="password"
          autoComplete="off"
          placeholder={hasToken ? "•••••••••••••••••••• (saved)" : "EAAG..."}
          className={`${inputClass} font-mono`}
        />
      </FormField>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 transition-colors shadow-sm shadow-blue-600/20"
        >
          {hasToken ? "Replace Token" : "Connect Facebook"}
        </button>
        {hasToken && (
          <button
            type="submit"
            name="disconnect"
            value="on"
            className="text-[13px] font-medium text-ink-600 hover:text-danger-500 border border-ink-200 hover:border-danger-500 rounded-lg px-4 py-2.5 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    </form>
  );
}

function Requirements() {
  return (
    <div className="mt-5 pt-5 border-t border-ink-100">
      <p className="text-[11.5px] font-semibold text-ink-500 uppercase tracking-wide mb-2">Token requirements</p>
      <ul className="text-[12px] text-ink-500 space-y-1.5 list-disc pl-4">
        <li>
          <code className="text-[11.5px]">ads_read</code> — campaigns, ad sets, ads and performance metrics
        </li>
        <li>
          <code className="text-[11.5px]">leads_retrieval</code> — actual lead-form submissions (optional; lead counts work
          without it)
        </li>
        <li>
          <code className="text-[11.5px]">business_management</code> — needed for accounts owned by a Business Manager
        </li>
        <li>
          Short-lived Explorer tokens expire in about an hour. Exchange one for a long-lived token (60 days) or use a System
          User token, which doesn&apos;t expire.
        </li>
      </ul>
    </div>
  );
}
