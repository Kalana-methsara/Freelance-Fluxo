import { useState } from 'react';

// 1. TYPES & INTERFACES
interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: 'Delivered' | 'Processing' | 'Cancelled';
}

interface NavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

function DashboardPage() {
  // Sample state with explicit TypeScript typing
  const [recentOrders] = useState<Order[]>([
    { id: '#1024', customer: 'Sarah Jenkins', product: 'Wireless Earbuds', amount: '$89.00', status: 'Delivered' },
    { id: '#1023', customer: 'Michael Chang', product: 'Mechanical Keyboard', amount: '$125.00', status: 'Processing' },
    { id: '#1022', customer: 'Emma Rodriguez', product: 'Leather Wallet', amount: '$45.00', status: 'Delivered' },
    { id: '#1021', customer: 'David Kim', product: 'Type-C Hub', amount: '$39.99', status: 'Cancelled' },
  ]);

  const navigationItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', href: '#dashboard', active: true },
    { label: 'Analytics', icon: '📈', href: '#analytics' },
    { label: 'Orders', icon: '🛒', href: '#orders' },
    { label: 'Customers', icon: '👤', href: '#customers' },
    { label: 'Settings', icon: '⚙️', href: '#settings' },
  ];

  // Helper for dynamic Tailwind status styling
  const getStatusClass = (status: Order['status']): string => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-amber-100 text-amber-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex-col hidden md:flex">
        <div className="text-2xl font-bold mb-10 tracking-wider text-sky-400">
          CoreDash
        </div>
        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                item.active 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* TOP HEADER */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back, Alex</h1>
            <p className="text-sm text-slate-500 mt-1">Here is what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-xl relative p-2 text-slate-600 hover:text-slate-900 transition-colors">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* METRICS CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <span className="text-2xl absolute top-6 right-6 opacity-80">💰</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</h3>
            <p className="text-3xl font-bold text-slate-900 my-2">$24,500</p>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              +12% from last month
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <span className="text-2xl absolute top-6 right-6 opacity-80">🛍️</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</h3>
            <p className="text-3xl font-bold text-slate-900 my-2">3,240</p>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              +8% from last week
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <span className="text-2xl absolute top-6 right-6 opacity-80">👥</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Customers</h3>
            <p className="text-3xl font-bold text-slate-900 my-2">1,120</p>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              -3% from yesterday
            </span>
          </div>
        </section>

        {/* DATA TABLE SECTION */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h2>
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-4">Order ID</th>
                <th className="pb-3 px-4">Customer</th>
                <th className="pb-3 px-4">Product</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-900">{order.id}</td>
                  <td className="py-4 px-4 text-slate-600">{order.customer}</td>
                  <td className="py-4 px-4 text-slate-600">{order.product}</td>
                  <td className="py-4 px-4 font-medium text-slate-900">{order.amount}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  );
}

export default DashboardPage;