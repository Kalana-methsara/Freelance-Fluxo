import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

interface PaymentMethod {
  cardLast4: string;
  brand: string;
  expiry: string;
  walletBalance: number;
}

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PaymentMethod>({
    cardLast4: "",
    brand: "",
    expiry: "",
    walletBalance: 0,
  });

  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setPaymentData({
        cardLast4: parsed.paymentMethod?.cardLast4 || "",
        brand: parsed.paymentMethod?.brand || "",
        expiry: parsed.paymentMethod?.expiry || "",
        walletBalance: parsed.paymentMethod?.walletBalance || 0,
      });
    }
  }, []);

  
  const handleAddMockCard = () => {
    const updatedMethod = {
      cardLast4: "4242",
      brand: "Visa",
      expiry: "12/28",
      walletBalance: paymentData.walletBalance,
    };

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.paymentMethod = { ...parsed.paymentMethod, ...updatedMethod };
      localStorage.setItem("user", JSON.stringify(parsed));
    }

    setPaymentData(updatedMethod);
    alert("Mock Visa Card (•••• 4242) added successfully!");
    
    
    navigate("/dashboard/client");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-600">fluxo</em>
          </Link>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Billing & Payments
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-10 pb-16 px-4">
        {/* Back Button & Title */}
        <div className="mb-8">
          {/* 💡 වෙනස 2: navigate(-1) වෙනුවට කෙලින්ම /dashboard/client එකට path එක වෙනස් කිරීම */}
          <button
            onClick={() => navigate("/dashboard/client")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Payment Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your payment methods, billing details, and digital wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ── LEFT COLUMN: Wallet Balance ── */}
          <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Your Wallet
            </h3>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center">
              <p className="text-xs text-emerald-700 font-medium">Available Balance</p>
              <p className="text-3xl font-extrabold text-emerald-800 mt-1">
                ${paymentData.walletBalance.toFixed(2)}
              </p>
            </div>
            <button className="w-full py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition">
              + Top Up Wallet
            </button>
          </div>

          {/* ── RIGHT COLUMN: Payment Methods ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Cards Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Saved Cards</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Primary cards used for funding contracts.</p>
                </div>
                {!paymentData.cardLast4 && (
                  <button
                    onClick={handleAddMockCard}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Add Card
                  </button>
                )}
              </div>

              <div className="p-6">
                {paymentData.cardLast4 ? (
                 
                  <div className="max-w-sm bg-gradient-to-r from-gray-800 to-gray-950 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
                    <div className="absolute right-4 bottom-4 opacity-10 text-5xl font-bold italic">
                      {paymentData.brand}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                          {paymentData.brand} Card
                        </p>
                        <p className="text-lg font-mono tracking-wider mt-2">
                          •••• •••• •••• {paymentData.cardLast4}
                        </p>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                        Primary
                      </span>
                    </div>
                    <div className="mt-6 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] uppercase text-gray-400 font-medium">Expires</p>
                        <p className="text-xs font-mono">{paymentData.expiry}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setPaymentData(prev => ({ ...prev, cardLast4: "", brand: "", expiry: "" }));
                          alert("Card removed!");
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 font-medium transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                 
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                    <p className="text-xs font-medium text-gray-500">No payment methods added yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Add a credit or debit card to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow Guarantee Banner */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-start">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <div className="text-xs leading-relaxed text-gray-600">
                <strong className="text-gray-900 font-semibold block mb-0.5">FreelanceFluxo Escrow Protection</strong>
                Your funds are only deposited into secure escrow when creating official milestones. Freelancers will only be paid after you successfully review and accept their milestone submissions.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}