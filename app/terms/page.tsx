"use client";

import { useRouter } from "next/navigation";

const EFFECTIVE_DATE = "May 1, 2026";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f4ff] px-5 py-10">
      <div className="max-w-180 mx-auto">
        <div className="card p-8 md:p-10">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center font-extrabold text-brand-500 text-lg">
                S
              </div>
              <span className="text-lg font-extrabold text-slate-800">SaveWise</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
              Auto-Saving Terms &amp; Conditions
            </h1>
            <p className="text-slate-400 text-sm">
              Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {EFFECTIVE_DATE}
            </p>
          </div>

          <div className="space-y-7 text-[14px] text-slate-600 leading-relaxed">
            {/* 1 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                1. Introduction &amp; Acceptance
              </h2>
              <p>
                These Auto-Saving Terms &amp; Conditions (&ldquo;Auto-Save Terms&rdquo;) form part of the
                SaveWise User Agreement. By enabling the Auto-Save feature and checking the
                acceptance box during onboarding, you (&ldquo;User&rdquo;) agree to be bound by these
                terms in full.
              </p>
              <p className="mt-2">
                SaveWise (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a savings and investment platform that
                facilitates automatic savings deductions from your linked funding sources on
                your chosen schedule. These terms govern how those deductions are authorised,
                executed, and managed.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                2. Authorisation to Deduct Savings
              </h2>
              <p>
                By agreeing to these terms, you expressly authorise SaveWise to:
              </p>
              <ul className="list-disc pl-5 mt-2.5 space-y-1.5">
                <li>
                  Automatically deduct the savings amount you specify — either as a
                  percentage of income or a fixed amount per cycle — from your linked bank
                  account or mobile money wallet.
                </li>
                <li>
                  Execute deductions at the frequency you choose: Daily, Weekly, Monthly,
                  or Every 2 Months.
                </li>
                <li>
                  Continue automatic deductions for the duration you set during onboarding,
                  subject to the minimum commitment period stated in Section 3.
                </li>
                <li>
                  Re-attempt a failed deduction up to three (3) times within the same
                  billing cycle before marking that cycle as missed. Missed cycles are
                  recorded and visible in your transaction history.
                </li>
              </ul>
              <p className="mt-2.5">
                This authorisation remains in effect until the commitment period ends, you
                explicitly disable Auto-Save from your settings, or your account is closed.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                3. Saving Preferences &amp; Minimum Commitment Period
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold text-slate-700">Minimum Duration:</span>{" "}
                  The minimum auto-save period is four (4) months. You may not configure a
                  saving duration shorter than this threshold.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Goal Deadlines:</span>{" "}
                  All personal savings goals (Savings Goal type) must have a deadline on or
                  after the end of your configured saving period — i.e., at least four (4)
                  months from the date the goal is created. Group Saving goals are exempt
                  from this minimum deadline rule.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Early Termination:</span>{" "}
                  If you wish to stop auto-saving before your commitment period ends, you
                  may request early termination from Settings &rarr; Auto-Save &rarr;
                  Cancel Plan. Requests are reviewed within 5 business days. All funds
                  already deposited remain accessible in your SaveWise wallet regardless
                  of termination.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Renewal:</span>{" "}
                  At the end of your saving period you will receive a notification offering
                  the option to renew, adjust your preferences, or stop auto-saving. If no
                  action is taken, auto-saving will pause automatically.
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                4. Funding Source Requirements
              </h2>
              <p>
                You are responsible for maintaining sufficient funds in your linked account
                or wallet to cover each scheduled deduction. SaveWise is not liable for:
              </p>
              <ul className="list-disc pl-5 mt-2.5 space-y-1.5">
                <li>
                  Overdraft fees or charges applied by your bank or mobile money provider
                  as a result of auto-save deductions.
                </li>
                <li>
                  Failed deductions due to insufficient balance, closed accounts, or
                  revoked account access.
                </li>
                <li>
                  Suspension of auto-saving when three (3) or more consecutive deduction
                  attempts fail within a single billing cycle.
                </li>
              </ul>
              <p className="mt-2.5">
                You may link multiple funding sources and designate a primary source for
                auto-save deductions at any time from Funding Sources in your dashboard.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                5. Withdrawal &amp; Access to Funds
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold text-slate-700">Unlocked Goals:</span>{" "}
                  Funds allocated to unlocked savings goals can be withdrawn at any time
                  from your Dashboard, subject to standard processing times of 1–3 business
                  days.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Locked Goals:</span>{" "}
                  If you enable the Lock-In option on a goal, you acknowledge that those
                  funds cannot be withdrawn before the goal&rsquo;s deadline under any
                  circumstances, including early termination of auto-saving.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Emergency Fund:</span>{" "}
                  Funds in your Emergency Fund are always accessible and are never subject
                  to lock-in or minimum-deadline rules.
                </li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                6. Modifying Your Preferences
              </h2>
              <p>
                You may update your saving amount, frequency, or active funding source at
                any time from Dashboard &rarr; Settings &rarr; Auto-Save. Changes take
                effect from the next scheduled deduction cycle. Reducing your saving
                duration below the remaining commitment period is not permitted until that
                period has been fully completed.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                7. Fees &amp; Charges
              </h2>
              <p>
                SaveWise does not charge a platform fee for the Auto-Save feature itself.
                The following third-party charges may still apply:
              </p>
              <ul className="list-disc pl-5 mt-2.5 space-y-1.5">
                <li>
                  Transaction or transfer fees imposed by your bank or mobile money provider
                  for each deduction. These are set by your provider and are outside
                  SaveWise&rsquo;s control.
                </li>
                <li>
                  Currency conversion fees if your linked account currency differs from
                  your SaveWise wallet currency.
                </li>
                <li>
                  Investment routing fees if you choose to auto-invest your saved funds.
                  These are detailed separately in the Investment Terms.
                </li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                8. Security &amp; Data Privacy
              </h2>
              <p>
                Your financial data and account credentials are protected with
                industry-standard encryption (AES-256 at rest; TLS 1.3 in transit).
                SaveWise does not store your bank or mobile money login credentials
                directly — we use tokenised access through our regulated payment partners.
              </p>
              <p className="mt-2">
                By agreeing to these terms you also acknowledge our Privacy Policy, which
                governs how we collect, process, and protect your personal information in
                accordance with applicable data protection law.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                9. Notifications &amp; Reminders
              </h2>
              <p>SaveWise will send you:</p>
              <ul className="list-disc pl-5 mt-2.5 space-y-1.5">
                <li>
                  A confirmation notification each time a deduction is successfully
                  processed.
                </li>
                <li>
                  An alert if a deduction fails, including the reason and recommended
                  next steps.
                </li>
                <li>
                  A reminder 7 days before your auto-save commitment period ends, giving
                  you the opportunity to renew or adjust your plan.
                </li>
              </ul>
              <p className="mt-2">
                Notifications are delivered via in-app alerts and to your registered email
                address. You can manage notification preferences in Settings.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                10. Changes to These Terms
              </h2>
              <p>
                SaveWise reserves the right to update these Auto-Save Terms at any time. We
                will notify you at least 14 days in advance of any material changes via
                email and in-app notification. Continued use of the Auto-Save feature after
                the effective date of any revision constitutes acceptance of the updated
                terms. If you do not agree to the changes, you may disable auto-saving from
                Settings before the new terms take effect.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                11. Governing Law &amp; Disputes
              </h2>
              <p>
                These terms are governed by the laws of the jurisdiction in which SaveWise
                is registered. Any dispute arising from the use of the Auto-Save feature
                that cannot be resolved through our support channels will be referred to
                binding arbitration under the applicable rules of the relevant arbitration
                body.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-[15px] font-extrabold text-slate-800 mb-2">
                12. Contact Us
              </h2>
              <p>
                If you have questions about these terms or your auto-saving arrangement,
                please reach out to our support team:
              </p>
              <ul className="list-none pl-0 mt-2.5 space-y-1.5">
                <li>
                  <span className="font-semibold text-slate-700">Email:</span>{" "}
                  <span className="text-brand-500">support@savewise.app</span>
                </li>
                <li>
                  <span className="font-semibold text-slate-700">In-App:</span>{" "}
                  Dashboard &rarr; Help &amp; Support &rarr; Contact Us
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Response time:</span>{" "}
                  1–2 business days
                </li>
              </ul>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-slate-400">
              &copy; 2026 SaveWise. All rights reserved.
            </p>
            <button
              onClick={() => router.back()}
              className="text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors"
            >
              ← Back to setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
