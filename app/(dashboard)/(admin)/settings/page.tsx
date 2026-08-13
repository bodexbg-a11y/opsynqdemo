import Link from "next/link";
import { Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAppSettings, CURRENCIES, DATE_FORMATS, TIMEZONES, EMAIL_DIGESTS } from "@/lib/settings";
import { updateProfileAction, changePasswordAction, updateAppSettingsAction } from "@/lib/actions-settings";
import { PageHeader, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";
import { AvatarUpload } from "@/components/modules/avatar-upload";
import { FacebookConnection } from "@/components/modules/facebook-connection";

const ERRORS: Record<string, string> = {
  invalid: "Name and email are both required.",
  email_taken: "Another account already uses that email address.",
  avatar_type: "That file type isn't supported — use PNG, JPG, WebP or GIF.",
  avatar_size: "That image is larger than 2 MB.",
  password_short: "The new password must be at least 6 characters.",
  password_mismatch: "The new passwords don't match.",
  password_wrong: "Your current password is incorrect.",
};

const SAVED: Record<string, string> = {
  profile: "Profile updated.",
  password: "Password changed.",
  workspace: "Workspace settings saved.",
  facebook: "Facebook access token saved.",
  facebook_disconnected: "Facebook disconnected.",
};

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 py-3 border-b border-ink-50 last:border-0 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 w-4 h-4 rounded border-ink-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
      />
      <span>
        <span className="block text-[13px] font-medium text-ink-800">{label}</span>
        <span className="block text-[11.5px] text-ink-400 mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 transition-colors shadow-sm shadow-blue-600/20"
    >
      {label}
    </button>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const current = await getCurrentUser();
  const settings = await getAppSettings();
  const [adminCount, pmCount] = await Promise.all([
    prisma.user.count({ where: { role: "Admin" } }),
    prisma.user.count({ where: { role: "ProjectManager" } }),
  ]);

  const roles = [
    { name: "Admin", desc: "Full access to all modules, financials and settings", count: adminCount },
    { name: "Project Manager", desc: "Sees only the projects and tasks assigned to them by an Admin", count: pmCount },
  ];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Settings" subtitle="Your profile, company details, notifications and permissions" />

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-danger-100 text-danger-500 px-4 py-3 text-[13px] font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {ERRORS[error] ?? "Something went wrong — please try again."}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2.5 rounded-xl bg-success-100 text-success-500 px-4 py-3 text-[13px] font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {SAVED[saved] ?? "Saved."}
        </div>
      )}

      <Tabs
        tabs={[
          {
            label: "My Profile",
            content: (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-5xl">
                <Card className="p-6 xl:col-span-2">
                  <form action={updateProfileAction} className="space-y-6">
                    <div>
                      <h3 className="text-[14px] font-semibold text-ink-900 mb-1">Profile Photo</h3>
                      <p className="text-[12px] text-ink-400 mb-4">Shown in the sidebar, top bar and anywhere you appear in the app.</p>
                      <AvatarUpload name={current?.name ?? "You"} currentUrl={current?.avatarUrl ?? null} />
                    </div>

                    <FormSection title="Details">
                      <FormField label="Full Name" required>
                        <input name="name" required defaultValue={current?.name} className={inputClass} />
                      </FormField>
                      <FormField label="Email" required hint="This is also your login">
                        <input name="email" type="email" required defaultValue={current?.email} className={inputClass} />
                      </FormField>
                      <FormField label="Job Title">
                        <input name="title" defaultValue={current?.title ?? ""} placeholder="Chief Executive Officer" className={inputClass} />
                      </FormField>
                      <FormField label="Phone">
                        <input name="phone" defaultValue={current?.phone ?? ""} placeholder="(555) 010-2233" className={inputClass} />
                      </FormField>
                    </FormSection>

                    <SaveButton label="Save Profile" />
                  </form>
                </Card>

                <Card className="p-6 h-fit">
                  <h3 className="text-[14px] font-semibold text-ink-900 mb-1">Change Password</h3>
                  <p className="text-[12px] text-ink-400 mb-4">You&apos;ll stay signed in on this device.</p>
                  <form action={changePasswordAction} className="space-y-4">
                    <FormField label="Current Password" required>
                      <input name="currentPassword" type="password" required className={inputClass} />
                    </FormField>
                    <FormField label="New Password" required hint="At least 6 characters">
                      <input name="newPassword" type="password" required minLength={6} className={inputClass} />
                    </FormField>
                    <FormField label="Confirm New Password" required>
                      <input name="confirmPassword" type="password" required minLength={6} className={inputClass} />
                    </FormField>
                    <SaveButton label="Update Password" />
                  </form>
                </Card>
              </div>
            ),
          },
          {
            label: "Company",
            content: (
              <Card className="p-6 max-w-3xl">
                <form action={updateAppSettingsAction} className="space-y-6">
                  <input type="hidden" name="tab" value="Company" />
                  <FormSection title="Company Profile" subtitle="Used across reports, exports and document headers">
                    <FormField label="Company Name" required>
                      <input name="companyName" required defaultValue={settings.companyName} className={inputClass} />
                    </FormField>
                    <FormField label="Headquarters">
                      <input name="headquarters" defaultValue={settings.headquarters} className={inputClass} />
                    </FormField>
                    <FormField label="Industry">
                      <input name="industry" defaultValue={settings.industry} className={inputClass} />
                    </FormField>
                    <FormField label="Plan">
                      <input name="plan" defaultValue={settings.plan} className={inputClass} />
                    </FormField>
                  </FormSection>

                  <FormSection title="Regional" subtitle="How amounts and dates are presented">
                    <FormField label="Currency">
                      <select name="currency" defaultValue={settings.currency} className={selectClass}>
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Date Format">
                      <select name="dateFormat" defaultValue={settings.dateFormat} className={selectClass}>
                        {DATE_FORMATS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Timezone" className="md:col-span-2">
                      <select name="timezone" defaultValue={settings.timezone} className={selectClass}>
                        {TIMEZONES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormSection>

                  <FormSection title="Operational Thresholds" subtitle="When the app starts warning you">
                    <FormField label="Budget Warning" hint="Warn once a project has spent this % of budget">
                      <input type="number" name="budgetWarningPct" min={1} max={100} defaultValue={settings.budgetWarningPct} className={inputClass} />
                    </FormField>
                    <FormField label="Deadline Warning" hint="Flag projects due within this many days">
                      <input type="number" name="deadlineWarningDays" min={1} max={180} defaultValue={settings.deadlineWarningDays} className={inputClass} />
                    </FormField>
                    <FormField label="Low-Stock Buffer" hint="Extra % above reorder level before flagging stock">
                      <input type="number" name="lowStockBufferPct" min={0} max={100} defaultValue={settings.lowStockBufferPct} className={inputClass} />
                    </FormField>
                  </FormSection>

                  {/* Notification prefs live on the same record, so carry them through
                      this form to avoid resetting them to their unchecked defaults. */}
                  <input type="hidden" name="emailDigest" value={settings.emailDigest} />
                  {settings.notifyDelayedProjects && <input type="hidden" name="notifyDelayedProjects" value="on" />}
                  {settings.notifyOverdueInvoices && <input type="hidden" name="notifyOverdueInvoices" value="on" />}
                  {settings.notifyEquipmentMaintenance && <input type="hidden" name="notifyEquipmentMaintenance" value="on" />}
                  {settings.notifyLowInventory && <input type="hidden" name="notifyLowInventory" value="on" />}
                  {settings.notifyEmployeeAbsence && <input type="hidden" name="notifyEmployeeAbsence" value="on" />}

                  <SaveButton />
                </form>
              </Card>
            ),
          },
          {
            label: "Notifications",
            content: (
              <Card className="p-6 max-w-3xl">
                <form action={updateAppSettingsAction} className="space-y-6">
                  <input type="hidden" name="tab" value="Notifications" />
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink-900">Alert Types</h3>
                    <p className="text-[12px] text-ink-400 mt-0.5 mb-2">Which events generate a notification in the bell menu.</p>
                    <div>
                      <Toggle
                        name="notifyDelayedProjects"
                        label="Delayed projects"
                        hint="A project falls behind schedule or is flagged high risk"
                        defaultChecked={settings.notifyDelayedProjects}
                      />
                      <Toggle
                        name="notifyOverdueInvoices"
                        label="Overdue invoices"
                        hint="An invoice passes its due date without payment"
                        defaultChecked={settings.notifyOverdueInvoices}
                      />
                      <Toggle
                        name="notifyEquipmentMaintenance"
                        label="Equipment maintenance"
                        hint="An asset is due for scheduled servicing"
                        defaultChecked={settings.notifyEquipmentMaintenance}
                      />
                      <Toggle
                        name="notifyLowInventory"
                        label="Low inventory"
                        hint="A material drops below its reorder level"
                        defaultChecked={settings.notifyLowInventory}
                      />
                      <Toggle
                        name="notifyEmployeeAbsence"
                        label="Employee absence"
                        hint="Someone goes on leave or starts vacation"
                        defaultChecked={settings.notifyEmployeeAbsence}
                      />
                    </div>
                  </div>

                  <FormSection title="Email Digest" subtitle="A rollup of everything above, sent to your inbox">
                    <FormField label="Frequency">
                      <select name="emailDigest" defaultValue={settings.emailDigest} className={selectClass}>
                        {EMAIL_DIGESTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormSection>

                  {/* Company fields belong to the same record — carry them through unchanged. */}
                  <input type="hidden" name="companyName" value={settings.companyName} />
                  <input type="hidden" name="headquarters" value={settings.headquarters} />
                  <input type="hidden" name="industry" value={settings.industry} />
                  <input type="hidden" name="plan" value={settings.plan} />
                  <input type="hidden" name="currency" value={settings.currency} />
                  <input type="hidden" name="dateFormat" value={settings.dateFormat} />
                  <input type="hidden" name="timezone" value={settings.timezone} />
                  <input type="hidden" name="lowStockBufferPct" value={settings.lowStockBufferPct} />
                  <input type="hidden" name="budgetWarningPct" value={settings.budgetWarningPct} />
                  <input type="hidden" name="deadlineWarningDays" value={settings.deadlineWarningDays} />

                  <SaveButton label="Save Notification Settings" />
                </form>
              </Card>
            ),
          },
          {
            label: "Integrations",
            content: <FacebookConnection />,
          },
          {
            label: "Roles & Access",
            content: (
              <Card className="overflow-hidden max-w-3xl">
                <div className="flex items-center justify-between px-5 pt-5 pb-1">
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink-900">Roles & Permissions</h3>
                    <p className="text-[12px] text-ink-400 mt-0.5">{adminCount + pmCount} accounts in this workspace</p>
                  </div>
                  <Link
                    href="/settings/users"
                    className="flex items-center gap-1.5 text-[12.5px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Manage Users
                  </Link>
                </div>
                <div className="divide-y divide-ink-50 mt-3">
                  {roles.map((r) => (
                    <div key={r.name} className="flex items-center gap-4 px-5 py-4">
                      <Badge variant="blue">{r.name}</Badge>
                      <p className="flex-1 text-[12.5px] text-ink-500">{r.desc}</p>
                      <span className="text-[12.5px] font-medium text-ink-800">{r.count} users</span>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
