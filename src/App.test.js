import { render, screen } from '@testing-library/react';
import App, {
  FIN_AUTO,
  FIN_EXCH_FULL,
  getFinassetsInOutRate,
  getOtherPSPAutoConvertRate,
  getOtherPSPDepositRate,
  getOtherPSPExchangeFullRate,
  getOtherPSPWithdrawRate,
} from './App';

test('renders the fee calculator without SEPA', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /crypto fee calculator/i })).toBeInTheDocument();
  expect(screen.queryByText(/sepa/i)).not.toBeInTheDocument();
});

test.each([
  [0, 0.004],
  [1_000_000, 0.004],
  [1_000_001, 0.003],
  [6_000_000, 0.003],
  [6_000_001, 0.0025],
  [10_000_000, 0.0025],
  [10_000_001, 0.002],
])('uses the correct Finassets IN/OUT rate at %s USD', (turnover, expectedRate) => {
  expect(getFinassetsInOutRate(turnover)).toBe(expectedRate);
});

test('keeps crypto exchange and auto-convert fees at 0.2%', () => {
  expect(FIN_EXCH_FULL).toBe(0.002);
  expect(FIN_AUTO).toBe(0.002);
});

test.each([
  0,
  1_000_000,
  1_000_001,
  1_176_470,
  1_176_471,
  5_882_353,
  5_882_354,
  6_000_000,
  6_000_001,
  10_000_000,
  10_000_001,
  11_764_706,
  11_764_707,
  25_000_000,
])('keeps every Finassets rate below its PSP benchmark at %s USD', (turnover) => {
  expect(getFinassetsInOutRate(turnover)).toBeLessThan(getOtherPSPDepositRate(turnover));
  expect(getFinassetsInOutRate(turnover)).toBeLessThan(getOtherPSPWithdrawRate(turnover));
  expect(FIN_EXCH_FULL).toBeLessThan(getOtherPSPExchangeFullRate(turnover));
  expect(FIN_AUTO).toBeLessThan(getOtherPSPAutoConvertRate(turnover));
});

test.each([
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [500_000, 500_000, 0, 0],
  [3_000_000, 3_000_000, 1_000_000, 1_000_000],
  [5_000_001, 5_000_000, 10_000_000, 10_000_000],
  [20_000_000, 5_000_000, 25_000_000, 25_000_000],
])('keeps the total Finassets fee below the PSP benchmark', (inVol, outVol, exchangeVol, autoVol) => {
  const turnover = inVol + outVol;
  const finTotal =
    inVol * getFinassetsInOutRate(turnover) +
    outVol * getFinassetsInOutRate(turnover) +
    exchangeVol * FIN_EXCH_FULL +
    autoVol * FIN_AUTO;
  const benchmarkTotal =
    inVol * getOtherPSPDepositRate(turnover) +
    outVol * getOtherPSPWithdrawRate(turnover) +
    exchangeVol * getOtherPSPExchangeFullRate(turnover) +
    autoVol * getOtherPSPAutoConvertRate(turnover);

  expect(finTotal).toBeLessThan(benchmarkTotal);
});
