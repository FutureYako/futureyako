"use client";

import { useState, useEffect } from "react";
import { BankIcon, PhoneIcon, CheckIcon, ArrowIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost, apiDelete } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceType = "bank" | "mobile";

interface FundingSourceAPI {
  id: string;
  source_type: SourceType;
  name: string;
  masked_identifier: string;
  account_holder_name: string;
  is_primary: boolean;
  status: string;
}

interface PaymentProvider {
  id: string;
  name: string;
  code: string;
  provider_type: "bank" | "mobile";
  country: string;
  is_active: boolean;
}

function toArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

// ─── Add Source Dialog ────────────────────────────────────────────────────────

function AddSourceDialog({
  onClose,
  onSuccess,
  initialType,
}: {
  onClose: () => void;
  onSuccess: () => void;
  initialType?: SourceType;
}) {
  const [step, setStep] = useState<"type" | "form">(initialType ? "form" : "type");
  const [sourceType, setSourceType] = useState<SourceType>(initialType ?? "bank");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [provider, setProvider] = useState("");
  const [phone, setPhone] = useState("");
  const [walletName, setWalletName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [banks, setBanks] = useState<PaymentProvider[]>([]);
  const [mobileProviders, setMobileProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const [banksRes, mobileRes] = await Promise.all([
          apiGet(API_ENDPOINTS.ADMIN.PUBLIC_BANKS),
          apiGet(API_ENDPOINTS.ADMIN.PUBLIC_MOBILE_PROVIDERS),
        ]);
        setBanks(toArray<PaymentProvider>(banksRes));
        setMobileProviders(toArray<PaymentProvider>(mobileRes));
      } catch {}
      setLoadingProviders(false);
    }
    fetchProviders();
  }, []);

  const canSave =
    sourceType === "bank"
      ? bankName !== "" && accountNumber !== "" && accountName !== ""
      : provider !== "" && phone !== "" && walletName !== "";

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (sourceType === "bank") {
        await apiPost(API_ENDPOINTS.WALLETS.FUNDING_SOURCES, {
          source_type: "bank",
          name: bankName,
          account_identifier: accountNumber,
          account_holder_name: accountName,
          is_primary: false,
        });
      } else {
        await apiPost(API_ENDPOINTS.WALLETS.FUNDING_SOURCES, {
          source_type: "mobile",
          name: provider,
          account_identifier: phone,
          account_holder_name: walletName,
          is_primary: false,
        });
      }
      onSuccess();
    } catch (err: any) {
      setSaveError(err.message || "Failed to link funding source");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-[460px] z-10 overflow-hidden">

        {step === "type" && (
          <div className="p-7">
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Add a funding source</h2>
            <p className="text-slate-500 text-[13px] mb-5">Choose the type of account you want to link</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["bank", "mobile"] as SourceType[]).map((t) => {
                const Icon = t === "bank" ? BankIcon : PhoneIcon;
                const selected = sourceType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSourceType(t)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selected ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selected ? "bg-brand-100 text-brand-500" : "bg-slate-100 text-slate-400"}`}>
                      <Icon size={18} />
                    </div>
                    <div className="font-bold text-sm text-slate-800">{t === "bank" ? "Bank Account" : "Mobile Money"}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t === "bank" ? "Link via account number" : "Link via phone number"}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-2" onClick={() => setStep("form")}>Continue →</button>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="p-7">
            <button
              className="flex items-center gap-1 text-[13px] text-slate-400 hover:text-brand-500 transition-colors mb-4"
              onClick={() => !initialType && setStep("type")}
            >
              {!initialType && <span>← </span>}
              <span className={`flex items-center gap-2 ${sourceType === "bank" ? "text-brand-500" : "text-blue-500"}`}>
                {sourceType === "bank" ? <BankIcon size={14} /> : <PhoneIcon size={14} />}
                <span className="font-semibold text-slate-800">{sourceType === "bank" ? "Bank Account" : "Mobile Money"}</span>
              </span>
            </button>

            <h2 className="text-lg font-extrabold text-slate-800 mb-1">
              {sourceType === "bank" ? "Enter bank details" : "Enter mobile money details"}
            </h2>
            <p className="text-slate-500 text-[13px] mb-5">Your details are encrypted and stored securely</p>

            <div className="space-y-4 mb-6">
              {sourceType === "bank" ? (
                <>
                  <div>
                    <label className="label-sm">Bank Name</label>
                    <select className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={loadingProviders}>
                      <option value="">{loadingProviders ? "Loading banks…" : banks.length === 0 ? "No banks available" : "Select your bank…"}</option>
                      {banks.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">Account Number</label>
                    <input className="input-field" placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-sm">Account Holder Name</label>
                    <input className="input-field" placeholder="Name on the account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label-sm">Provider</label>
                    <select className="input-field" value={provider} onChange={(e) => setProvider(e.target.value)} disabled={loadingProviders}>
                      <option value="">{loadingProviders ? "Loading providers…" : mobileProviders.length === 0 ? "No providers available" : "Select your provider…"}</option>
                      {mobileProviders.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">Phone Number</label>
                    <input className="input-field" type="tel" placeholder="+255 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-sm">Wallet / Account Name</label>
                    <input className="input-field" placeholder="Name on this wallet" value={walletName} onChange={(e) => setWalletName(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {saveError && <div className="text-[12px] text-danger mb-3 bg-danger/5 rounded-lg px-3 py-2">{saveError}</div>}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-2" disabled={!canSave || isSaving} onClick={handleSave}>
                {isSaving ? "Linking…" : "Link Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="flex items-center gap-1 bg-success-light text-success text-[11px] font-semibold px-2.5 py-1 rounded-full">
        <CheckIcon size={10} /> Active
      </span>
    );
  }
  if (status === "verification_pending") {
    return (
      <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
        Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 bg-slate-100 text-slate-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FundingSourcesPage() {
  const [sources, setSources] = useState<FundingSourceAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; type?: SourceType }>({ open: false });

  useEffect(() => { fetchSources(); }, []);

  const fetchSources = async () => {
    if (!localStorage.getItem("access_token")) { setIsLoading(false); return; }
    try {
      const data = await apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES);
      setSources(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      // Auth errors handled by api.ts
    } finally {
      setIsLoading(false);
    }
  };

  async function handleRemove(id: string) {
    try {
      await apiDelete(`${API_ENDPOINTS.WALLETS.FUNDING_SOURCES}${id}/`);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to remove funding source:", err);
    }
    setRemoving(null);
  }

  async function handleSetPrimary(id: string) {
    setSettingPrimary(id);
    try {
      await apiPost(`${API_ENDPOINTS.WALLETS.FUNDING_SOURCES}${id}/set-primary/`);
      setSources((prev) =>
        prev.map((s) => ({ ...s, is_primary: s.id === id }))
      );
    } catch (err) {
      console.error("Failed to set primary:", err);
    }
    setSettingPrimary(null);
  }

  return (
    <>
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-slate-500">Loading funding sources…</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-extrabold text-slate-800">Funding Sources</h1>
                <p className="text-slate-500 text-sm">Manage your linked bank and mobile money accounts</p>
              </div>
              <button className="btn-primary w-auto! px-5" onClick={() => setDialog({ open: true })}>
                + Add Source
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Total Sources</div>
                <div className="text-xl font-extrabold text-slate-800">{sources.length}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Bank Accounts</div>
                <div className="text-xl font-extrabold text-brand-500">
                  {sources.filter((s) => s.source_type === "bank").length}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Mobile Money</div>
                <div className="text-xl font-extrabold text-blue-500">
                  {sources.filter((s) => s.source_type === "mobile").length}
                </div>
              </div>
            </div>

            {/* Linked sources list */}
            {sources.length > 0 ? (
              <div className="card p-6 mb-5">
                <div className="font-bold text-sm text-slate-800 mb-4">Linked Accounts</div>
                <div className="divide-y divide-slate-100">
                  {sources.map((src) => {
                    const Icon = src.source_type === "bank" ? BankIcon : PhoneIcon;
                    const iconStyle =
                      src.source_type === "bank"
                        ? "bg-brand-100 text-brand-500"
                        : "bg-blue-100 text-blue-500";
                    return (
                      <div key={src.id} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">{src.name}</span>
                              {src.is_primary && (
                                <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-slate-400">{src.masked_identifier}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {src.account_holder_name} · {src.source_type === "bank" ? "Bank Account" : "Mobile Money"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={src.status} />
                          {removing === src.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleRemove(src.id)} className="text-[12px] font-semibold text-danger hover:underline">Confirm</button>
                              <button onClick={() => setRemoving(null)} className="text-[12px] text-slate-400 hover:underline">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {!src.is_primary && (
                                <button
                                  onClick={() => handleSetPrimary(src.id)}
                                  disabled={settingPrimary === src.id}
                                  className="text-[12px] text-brand-500 hover:underline disabled:opacity-50"
                                >
                                  {settingPrimary === src.id ? "Setting…" : "Set primary"}
                                </button>
                              )}
                              <button onClick={() => setRemoving(src.id)} className="text-[12px] text-slate-400 hover:text-danger transition-colors">
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card p-10 text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BankIcon size={22} className="text-slate-400" />
                </div>
                <div className="font-bold text-sm text-slate-800 mb-1">No funding sources linked</div>
                <p className="text-[13px] text-slate-400 mb-5">
                  Add a bank account or mobile money account to start saving automatically.
                </p>
                <button className="btn-primary w-auto! px-8 mx-auto" onClick={() => setDialog({ open: true })}>
                  Link a Source
                </button>
              </div>
            )}

            {/* Quick-add tiles */}
            <div className="card p-6">
              <div className="font-bold text-sm text-slate-800 mb-4">Add Another Source</div>
              <div className="grid grid-cols-2 gap-3">
                {(["bank", "mobile"] as SourceType[]).map((t) => {
                  const Icon = t === "bank" ? BankIcon : PhoneIcon;
                  const style =
                    t === "bank"
                      ? { bg: "bg-brand-100", text: "text-brand-500" }
                      : { bg: "bg-blue-100", text: "text-blue-500" };
                  return (
                    <button
                      key={t}
                      onClick={() => setDialog({ open: true, type: t })}
                      className="flex items-center justify-between p-4 rounded-xl border-[1.5px] border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800">{t === "bank" ? "Bank Account" : "Mobile Money"}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{t === "bank" ? "Link via account number" : "Link via phone number"}</div>
                        </div>
                      </div>
                      <ArrowIcon size={15} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {dialog.open && (
        <AddSourceDialog
          onClose={() => setDialog({ open: false })}
          onSuccess={() => { fetchSources(); setDialog({ open: false }); }}
          initialType={dialog.type}
        />
      )}
    </>
  );
}
