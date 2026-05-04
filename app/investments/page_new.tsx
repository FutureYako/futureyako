"use client";

import { useState, useEffect } from "react";
import { SparkLine } from "@/components/ui/Charts";
import { CheckIcon, InvestIcon, BankIcon, PhoneIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";
import { formatTsh } from "@/lib/currency";

interface Fund {
  id: string;
  name: string;
  category: string;
  annual_roi: number;
  min_investment: number;
  risk_level: "Low" | "Medium" | "High";
  duration: string;
  description: string;
  highlights: string[];
  is_active: boolean;
}

interface Investment {
  id: string;
  fund: Fund;
  amount: number;
  current_value: number;
  status: string;
  created_at: string;
}

export default function InvestmentsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvestmentData();
  }, []);

  const fetchInvestmentData = async () => {
    try {
      // Get investment funds
      const fundsResponse = await apiGet(API_ENDPOINTS.INVESTMENTS.FUNDS);
      setFunds(fundsResponse.results || []);

      // Get user's investments
      const investmentsResponse = await apiGet(API_ENDPOINTS.INVESTMENTS.HOLDINGS);
      setInvestments(investmentsResponse.results || []);
    } catch (err: any) {
      console.error('Investments fetch error:', err);
      setError(err.message || 'Failed to load investment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedFund || !investmentAmount) return;

    try {
      const investmentData = {
        fund_id: selectedFund.id,
        amount: parseFloat(investmentAmount),
      };

      const response = await apiPost(API_ENDPOINTS.INVESTMENTS.HOLDINGS, investmentData);
      setInvestments(prev => [...prev, response]);
      setSelectedFund(null);
      setInvestmentAmount("");
    } catch (err: any) {
      console.error('Investment error:', err);
      setError(err.message || 'Failed to create investment');
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalReturns = totalCurrentValue - totalInvested;

  const riskColors = {
    "Low": "text-success",
    "Medium": "text-warning", 
    "High": "text-danger"
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-5"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchInvestmentData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-extrabold text-slate-800 mb-5">Investments</h1>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Total Invested</div>
          <div className="text-2xl font-bold text-brand-500">
            {formatTsh(totalInvested)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Current Value</div>
          <div className="text-2xl font-bold text-success">
            {formatTsh(totalCurrentValue)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Returns</div>
          <div className={`text-2xl font-bold ${totalReturns >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalReturns >= 0 ? '+' : ''}{formatTsh(totalReturns)}
          </div>
        </div>
      </div>

      {/* Investment Funds */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-sm text-slate-800 mb-4">Available Funds</h2>
        <div className="grid grid-cols-2 gap-4">
          {funds.filter(f => f.is_active).map((fund) => (
            <div key={fund.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800">{fund.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${riskColors[fund.risk_level]}`}>
                  {fund.risk_level}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{fund.category}</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Annual ROI</span>
                <span className="font-semibold text-success">{fund.annual_roi}%</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-600">Min Investment</span>
                <span className="font-semibold">{formatTsh(fund.min_investment)}</span>
              </div>
              <button
                onClick={() => setSelectedFund(fund)}
                className="btn-outline w-full text-sm"
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Investments */}
      <div className="card p-5">
        <h2 className="font-bold text-sm text-slate-800 mb-4">Your Investments</h2>
        {investments.length === 0 ? (
          <div className="text-center py-8">
            <InvestIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No investments yet</h3>
            <p className="text-slate-500 mb-4">Start by investing in one of our funds</p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map((investment) => (
              <div key={investment.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{investment.fund.name}</h3>
                    <p className="text-xs text-slate-500">{investment.fund.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    investment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {investment.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Invested: </span>
                    <span className="font-semibold">{formatTsh(investment.amount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Current: </span>
                    <span className={`font-semibold ${investment.current_value >= investment.amount ? 'text-success' : 'text-danger'}`}>
                      {formatTsh(investment.current_value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investment Modal */}
      {selectedFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Invest in {selectedFund.name}</h2>
            <div className="mb-4">
              <div className="text-sm text-slate-600 mb-2">
                <strong>Fund:</strong> {selectedFund.name}
              </div>
              <div className="text-sm text-slate-600 mb-2">
                <strong>Category:</strong> {selectedFund.category}
              </div>
              <div className="text-sm text-slate-600 mb-2">
                <strong>Risk Level:</strong> 
                <span className={`ml-1 ${riskColors[selectedFund.risk_level]}`}>
                  {selectedFund.risk_level}
                </span>
              </div>
              <div className="text-sm text-slate-600 mb-2">
                <strong>Annual ROI:</strong> <span className="text-success">{selectedFund.annual_roi}%</span>
              </div>
              <div className="text-sm text-slate-600 mb-4">
                <strong>Min Investment:</strong> {formatTsh(selectedFund.min_investment)}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Investment Amount</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min={selectedFund.min_investment}
                className="input-field"
                placeholder={`Minimum: ${formatTsh(selectedFund.min_investment)}`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleInvest}
                disabled={!investmentAmount || parseFloat(investmentAmount) < selectedFund.min_investment}
                className="btn-primary flex-1"
              >
                Confirm Investment
              </button>
              <button
                onClick={() => {
                  setSelectedFund(null);
                  setInvestmentAmount("");
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
