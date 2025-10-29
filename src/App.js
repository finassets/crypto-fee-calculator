import React, { useMemo, useState } from "react";

/**
 * Simplified Crypto Fee Calculator – Auto-calculation version
 * - No email / consent fields
 * - Automatically calculates on input change
 * - Unified white card design, responsive Tailwind layout
 * - Required fields marked with *
 */

function formatUSD(n) {
  if (!isFinite(n)) return "$0";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatPct(n) {
  if (!isFinite(n)) return "0%";
  return (n * 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%";
}

function clampNonNegative(v) {
  const n = Number(v);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function getFinassetsInOutRate(turnover) {
  if (turnover <= 1_000_000) return 0.0040;
  if (turnover <= 3_000_000) return 0.0030;
  if (turnover <= 6_000_000) return 0.0025;
  if (turnover <= 10_000_000) return 0.0022;
  return 0.0020;
}

function getOtherPSPDepositRate(turnover) {
  if (turnover <= 1_176_470) return 0.0050;
  if (turnover <= 5_882_353) return 0.0045;
  if (turnover <= 11_764_706) return 0.0040;
  return 0.0035;
}

function getOtherPSPWithdrawRate(turnover) {
  if (turnover <= 1_176_470) return 0.0035;
  if (turnover <= 5_882_353) return 0.0025;
  if (turnover <= 11_764_706) return 0.0020;
  return 0.0010;
}

function getOtherPSPExchangeFullRate(turnover) {
  if (turnover <= 1_176_470) return 0.0060;
  if (turnover <= 5_882_353) return 0.0055;
  if (turnover <= 11_764_706) return 0.0050;
  return 0.0040;
}

function getOtherPSPAutoConvertRate(turnover) {
  if (turnover <= 1_176_470) return 0.0100;
  if (turnover <= 5_882_353) return 0.0095;
  if (turnover <= 11_764_706) return 0.0090;
  return 0.0085;
}

const FIN_EXCH_FULL = 0.0020;
const FIN_AUTO = 0.0020;
const FIN_SEPA = 0.0130;
const OTHER_SEPA = 0.0200;

const Field = ({ label, id, value, onChange, hint, required }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-gray-800">{label}{required && <span className="text-red-500"> *</span>}</label>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      value={value}
      onChange={(e) => onChange(clampNonNegative(e.target.value))}
    />
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const Stat = ({ label, value, accent }) => (
  <div className={`rounded-2xl px-4 py-3 shadow-sm border ${accent ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const Table = ({ children }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);

const TH = ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">{children}</th>;
const TD = ({ children, right }) => <td className={`px-4 py-3 text-sm ${right ? "text-right" : "text-left"}`}>{children}</td>;

export default function CryptoFeeCalculator() {
  const [inVol, setInVol] = useState(0);
  const [outVol, setOutVol] = useState(0);
  const [exchVol, setExchVol] = useState(0);
  const [autoVol, setAutoVol] = useState(0);
  const [sepaVol, setSepaVol] = useState(0);

  const turnover = useMemo(() => inVol + outVol + sepaVol, [inVol, outVol, sepaVol]);

  const rates = useMemo(() => {
    const finInOut = getFinassetsInOutRate(turnover);
    const otherDep = getOtherPSPDepositRate(turnover);
    const otherWd = getOtherPSPWithdrawRate(turnover);
    const otherExFull = getOtherPSPExchangeFullRate(turnover);
    const otherAuto = getOtherPSPAutoConvertRate(turnover);
    return {
      fin: { deposit: finInOut, withdraw: finInOut, exchFull: FIN_EXCH_FULL, auto: FIN_AUTO, sepa: FIN_SEPA },
      other: { deposit: otherDep, withdraw: otherWd, exchFull: otherExFull, auto: otherAuto, sepa: OTHER_SEPA },
    };
  }, [turnover]);

  const fees = useMemo(() => {
    const fin = {
      deposit: inVol * rates.fin.deposit,
      withdraw: outVol * rates.fin.withdraw,
      exchFull: exchVol * rates.fin.exchFull,
      auto: autoVol * rates.fin.auto,
      sepa: sepaVol * rates.fin.sepa,
    };
    fin.total = fin.deposit + fin.withdraw + fin.exchFull + fin.auto + fin.sepa;

    const other = {
      deposit: inVol * rates.other.deposit,
      withdraw: outVol * rates.other.withdraw,
      exchFull: exchVol * rates.other.exchFull,
      auto: autoVol * rates.other.auto,
      sepa: sepaVol * rates.other.sepa,
    };
    other.total = other.deposit + other.withdraw + other.exchFull + other.auto + other.sepa;

    const savingsUSD = Math.max(0, other.total - fin.total);
    const savingsPct = other.total > 0 ? savingsUSD / other.total : 0;

    return { fin, other, savingsUSD, savingsPct, annual: savingsUSD * 12 };
  }, [inVol, outVol, exchVol, autoVol, sepaVol, rates]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Crypto Fee Calculator</h1>
      <p className="text-gray-600 mb-6">Automatically compare Finassets vs other PSPs. Adjust volumes to instantly see updated commissions and savings.</p>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Enter Your Monthly Volumes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Crypto Deposits (IN)" id="in" required value={inVol} onChange={setInVol} hint="USD" />
          <Field label="Crypto Withdrawals (OUT)" id="out" required value={outVol} onChange={setOutVol} hint="USD" />
          <Field label="Exchange Volume (Crypto↔Crypto)" id="exch" value={exchVol} onChange={setExchVol} hint="Optional" />
          <Field label="Auto-Convert Volume" id="auto" value={autoVol} onChange={setAutoVol} hint="Optional" />
          <Field label="SEPA Transfers (Bank OUT)" id="sepa" value={sepaVol} onChange={setSepaVol} hint="Optional" />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Monthly Turnover" value={formatUSD(turnover)} accent />
          <Stat label="Finassets Rate Tier" value={formatPct(rates.fin.deposit)} />
          <Stat label="Other PSP Deposit Rate" value={formatPct(rates.other.deposit)} />
        </div>
      </div>

      <section className="space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Fee Rates Based on Your Turnover</h3>
          <Table>
            <thead>
              <tr><TH>Operation</TH><TH>Finassets</TH><TH>Other PSP</TH></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><TD>Deposit (IN)</TD><TD right>{formatPct(rates.fin.deposit)}</TD><TD right>{formatPct(rates.other.deposit)}</TD></tr>
              <tr><TD>Withdraw (OUT)</TD><TD right>{formatPct(rates.fin.withdraw)}</TD><TD right>{formatPct(rates.other.withdraw)}</TD></tr>
              <tr><TD>Exchange (full cycle)</TD><TD right>{formatPct(rates.fin.exchFull)}</TD><TD right>{formatPct(rates.other.exchFull)}</TD></tr>
              <tr><TD>Auto Convert</TD><TD right>{formatPct(rates.fin.auto)}</TD><TD right>{formatPct(rates.other.auto)}</TD></tr>
              <tr><TD>SEPA OUT</TD><TD right>{formatPct(rates.fin.sepa)}</TD><TD right>{formatPct(rates.other.sepa)}</TD></tr>
            </tbody>
          </Table>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Your Monthly Fees</h3>
          <Table>
            <thead>
              <tr><TH>Operation</TH><TH>Volume</TH><TH>Finassets</TH><TH>Other PSP</TH></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><TD>Deposit (IN)</TD><TD right>{formatUSD(inVol)}</TD><TD right>{formatUSD(fees.fin.deposit)}</TD><TD right>{formatUSD(fees.other.deposit)}</TD></tr>
              <tr><TD>Withdraw (OUT)</TD><TD right>{formatUSD(outVol)}</TD><TD right>{formatUSD(fees.fin.withdraw)}</TD><TD right>{formatUSD(fees.other.withdraw)}</TD></tr>
              <tr><TD>Exchange</TD><TD right>{formatUSD(exchVol)}</TD><TD right>{formatUSD(fees.fin.exchFull)}</TD><TD right>{formatUSD(fees.other.exchFull)}</TD></tr>
              <tr><TD>Auto Convert</TD><TD right>{formatUSD(autoVol)}</TD><TD right>{formatUSD(fees.fin.auto)}</TD><TD right>{formatUSD(fees.other.auto)}</TD></tr>
              <tr><TD>SEPA OUT</TD><TD right>{formatUSD(sepaVol)}</TD><TD right>{formatUSD(fees.fin.sepa)}</TD><TD right>{formatUSD(fees.other.sepa)}</TD></tr>
              <tr className="bg-gray-50 font-semibold"><TD>Total</TD><TD></TD><TD right>{formatUSD(fees.fin.total)}</TD><TD right>{formatUSD(fees.other.total)}</TD></tr>
            </tbody>
          </Table>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Total Savings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label="Savings (USD)" value={formatUSD(fees.savingsUSD)} accent />
            <Stat label="Savings (%)" value={formatPct(fees.savingsPct)} />
            <Stat label="Annual Benefit" value={formatUSD(fees.annual)} />
          </div>
        </div>
      </section>
    </div>
  );
}
