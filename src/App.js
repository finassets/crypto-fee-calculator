import React, { useMemo, useState } from "react";

function formatUSD(n, showDash = false) {
  if (showDash) return "-";
  if (!isFinite(n)) return "$0";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatPct(n, showDash = false) {
  if (showDash) return "-";
  if (!isFinite(n)) return "0%";
  return (n * 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  }) + "%";
}

function clampNonNegative(v) {
  const n = Number(v);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function getFinassetsInOutRate(turnover) {
  if (turnover <= 1_000_000) return 0.0040;
  if (turnover <= 6_000_000) return 0.0030;
  if (turnover <= 10_000_000) return 0.0025;
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

const ORANGE = "rgb(255 109 0)";

const Field = ({ label, id, value, onChange, hint, required }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-gray-800">
      {label}
      {required && <span style={{ color: ORANGE }}> *</span>}
    </label>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      placeholder="enter data here"
      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2"
      style={{ focusRingColor: ORANGE }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const Stat = ({ label, value, accent }) => (
  <div
    className={`rounded-2xl px-4 py-3 shadow-sm border ${
      accent ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
    }`}
    style={accent ? { backgroundColor: "rgba(255,109,0,0.08)", borderColor: ORANGE } : {}}
  >
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const Table = ({ children }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);

const TH = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50">
    {children}
  </th>
);
const TD = ({ children, right }) => (
  <td className={`px-4 py-3 text-sm ${right ? "text-right" : "text-left"}`}>{children}</td>
);

export default function CryptoFeeCalculator() {
  const [inVol, setInVol] = useState("");
  const [outVol, setOutVol] = useState("");
  const [exchVol, setExchVol] = useState("");
  const [autoVol, setAutoVol] = useState("");
  const [sepaVol, setSepaVol] = useState("");

  const inNum = inVol === "" ? 0 : clampNonNegative(inVol);
  const outNum = outVol === "" ? 0 : clampNonNegative(outVol);
  const exchNum = exchVol === "" ? 0 : clampNonNegative(exchVol);
  const autoNum = autoVol === "" ? 0 : clampNonNegative(autoVol);
  const sepaNum = sepaVol === "" ? 0 : clampNonNegative(sepaVol);

  const requiredEmpty = inVol === "" || outVol === "";
  const turnover = useMemo(() => inNum + outNum + sepaNum, [inNum, outNum, sepaNum]);

  const rates = useMemo(() => {
    const finInOut = getFinassetsInOutRate(turnover);
    const otherDep = getOtherPSPDepositRate(turnover);
    const otherWd = getOtherPSPWithdrawRate(turnover);
    const otherExFull = getOtherPSPExchangeFullRate(turnover);
    const otherAuto = getOtherPSPAutoConvertRate(turnover);
    return {
      fin: {
        deposit: finInOut,
        withdraw: finInOut,
        exchFull: FIN_EXCH_FULL,
        auto: FIN_AUTO,
        sepa: FIN_SEPA,
      },
      other: {
        deposit: otherDep,
        withdraw: otherWd,
        exchFull: otherExFull,
        auto: otherAuto,
        sepa: OTHER_SEPA,
      },
    };
  }, [turnover]);

  const fees = useMemo(() => {
    const fin = {
      deposit: inNum * rates.fin.deposit,
      withdraw: outNum * rates.fin.withdraw,
      exchFull: exchNum * rates.fin.exchFull,
      auto: autoNum * rates.fin.auto,
      sepa: sepaNum * rates.fin.sepa,
    };
    fin.total = fin.deposit + fin.withdraw + fin.exchFull + fin.auto + fin.sepa;

    const other = {
      deposit: inNum * rates.other.deposit,
      withdraw: outNum * rates.other.withdraw,
      exchFull: exchNum * rates.other.exchFull,
      auto: autoNum * rates.other.auto,
      sepa: sepaNum * rates.other.sepa,
    };
    other.total = other.deposit + other.withdraw + other.exchFull + other.auto + other.sepa;

    const savingsUSD = Math.max(0, other.total - fin.total);
    const savingsPct = other.total > 0 ? savingsUSD / other.total : 0;

    return { fin, other, savingsUSD, savingsPct, annual: savingsUSD * 12 };
  }, [inNum, outNum, exchNum, autoNum, sepaNum, rates]);

  const showDash = requiredEmpty;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: ORANGE }}>Crypto Fee Calculator</h1>
      <p className="text-gray-600 mb-6">
        Automatically compare Finassets vs other PSPs. Adjust volumes to instantly see updated commissions and savings.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Enter Your Monthly Volumes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Crypto Deposits (IN)" id="in" required value={inVol} onChange={setInVol} hint="USD" />
          <Field label="Crypto Withdrawals (OUT)" id="out" required value={outVol} onChange={setOutVol} hint="USD" />
          <Field label="Exchange Volume (Crypto↔Crypto)" id="exch" value={exchVol} onChange={setExchVol} hint="Optional" />
          <Field label="Auto-Convert Volume" id="auto" value={autoVol} onChange={setAutoVol} hint="Optional" />
          <Field label="SEPA Transfers (Bank OUT)" id="sepa" value={sepaVol} onChange={setSepaVol} hint="Optional" />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-1 gap-3">
          <Stat label="Monthly Turnover" value={showDash ? "-" : formatUSD(turnover)} accent />
        </div>
      </div>

      <section className="space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3" style={{ color: ORANGE }}>Fee Rates Based on Your Turnover</h3>
          <Table>
            <thead>
              <tr>
                <TH>Operation</TH>
                <TH>Finassets</TH>
                <TH>Other PSP</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><TD>Deposit (IN)</TD><TD right>{formatPct(rates.fin.deposit, showDash)}</TD><TD right>{formatPct(rates.other.deposit, showDash)}</TD></tr>
              <tr><TD>Withdraw (OUT)</TD><TD right>{formatPct(rates.fin.withdraw, showDash)}</TD><TD right>{formatPct(rates.other.withdraw, showDash)}</TD></tr>
              <tr><TD>Exchange (full cycle)</TD><TD right>{formatPct(rates.fin.exchFull, showDash)}</TD><TD right>{formatPct(rates.other.exchFull, showDash)}</TD></tr>
              <tr><TD>Auto Convert</TD><TD right>{formatPct(rates.fin.auto, showDash)}</TD><TD right>{formatPct(rates.other.auto, showDash)}</TD></tr>
              <tr><TD>SEPA OUT</TD><TD right>{formatPct(rates.fin.sepa, showDash)}</TD><TD right>{formatPct(rates.other.sepa, showDash)}</TD></tr>
            </tbody>
          </Table>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-3" style={{ color: ORANGE }}>Your Monthly Fees</h3>
          <Table>
            <thead>
              <tr>
                <TH>Operation</TH>
                <TH>Finassets</TH>
                <TH>Other PSP</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><TD>Deposit (IN)</TD><TD right>{formatUSD(fees.fin.deposit, showDash)}</TD><TD right>{formatUSD(fees.other.deposit, showDash)}</TD></tr>
              <tr><TD>Withdraw (OUT)</TD><TD right>{formatUSD(fees.fin.withdraw, showDash)}</TD><TD right>{formatUSD(fees.other.withdraw, showDash)}</TD></tr>
              <tr><TD>Exchange</TD><TD right>{formatUSD(fees.fin.exchFull, showDash)}</TD><TD right>{formatUSD(fees.other.exchFull, showDash)}</TD></tr>
              <tr><TD>Auto Convert</TD><TD right>{formatUSD(fees.fin.auto, showDash)}</TD><TD right>{formatUSD(fees.other.auto, showDash)}</TD></tr>
              <tr><TD>SEPA OUT</TD><TD right>{formatUSD(fees.fin.sepa, showDash)}</TD><TD right>{formatUSD(fees.other.sepa, showDash)}</TD></tr>
              <tr className="bg-gray-50 font-semibold"><TD>Total</TD><TD right>{formatUSD(fees.fin.total, showDash)}</TD><TD right>{formatUSD(fees.other.total, showDash)}</TD></tr>
            </tbody>
          </Table>
        </div>

        <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 sm:p-6 shadow-sm" style={{ borderColor: ORANGE, backgroundColor: "rgba(255,109,0,0.08)" }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: ORANGE }}>Total Savings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label="Savings (USD)" value={formatUSD(fees.savingsUSD, showDash)} />
            <Stat label="Savings (%)" value={formatPct(fees.savingsPct, showDash)} />
            <Stat label="Annual Benefit" value={formatUSD(fees.annual, showDash)} />
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-700 text-sm">
            Want to make this saving a reality? {" "}
            <a href="https://www.finassets.io/en/contact/" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE, fontWeight: 600 }} className="hover:underline">
              Contact Us
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
