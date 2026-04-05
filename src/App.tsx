import { useState, useEffect, FormEvent, ReactNode } from 'react';
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Users,
  Plus,
  Filter,
  Trash2,
  ShieldCheck,
  TrendingUp,
  History,
  LogOut,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';

interface Transaction {
  id: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryTotals: { category: string; total: number }[];
  recentActivity: Transaction[];
}

interface User {
  id: number;
  username: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
}

// --- Clay Primitives ---

const ClayCard = ({ children, className = "", hover = true, ...props }: { children: ReactNode, className?: string, hover?: boolean, [key: string]: any }) => (
  <motion.div
    whileHover={hover ? { y: -8, transition: { duration: 0.3 } } : {}}
    className={`relative overflow-hidden rounded-[32px] bg-white/70 backdrop-blur-xl p-8 text-clay-foreground shadow-clay-card border border-white/40 ${className}`}
    {...props}
  >
    <div className="relative z-10 flex h-full flex-col">{children}</div>
  </motion.div>
);

const ClayButton = ({
  children,
  onClick,
  variant = 'primary',
  className = "",
  type = "button",
  disabled
}: {
  children: ReactNode,
  onClick?: () => void,
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger',
  className?: string,
  type?: "button" | "submit",
  disabled?: boolean
}) => {
  const variants = {
    primary: "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clay-button",
    secondary: "bg-white text-clay-foreground shadow-clay-button",
    ghost: "text-clay-foreground hover:bg-clay-accent/10",
    danger: "bg-rose-500 text-white shadow-clay-button"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      className={`h-14 px-6 rounded-[20px] font-nunito font-black tracking-wide transition-all flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const ClayInput = ({ ...props }: any) => (
  <input
    {...props}
    className="h-16 w-full rounded-[20px] bg-[#EFEBF5] px-6 py-4 text-clay-foreground text-lg shadow-clay-pressed border-0 focus:bg-white focus:ring-4 focus:ring-clay-accent/20 transition-all outline-none placeholder:text-clay-muted"
  />
);

const ClaySelect = ({ ...props }: any) => (
  <select
    {...props}
    className="h-16 w-full rounded-[20px] bg-[#EFEBF5] px-6 py-4 text-clay-foreground text-lg shadow-clay-pressed border-0 focus:bg-white focus:ring-4 focus:ring-clay-accent/20 transition-all outline-none appearance-none cursor-pointer"
  />
);

// --- Background Blobs ---
const BackgroundBlobs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [0, 2, 0]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[10%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-clay-accent/10 blur-3xl"
    />
    <motion.div
      animate={{
        y: [0, -15, 0],
        rotate: [0, -2, 0]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute -right-[10%] top-[20%] h-[60vh] w-[60vh] rounded-full bg-clay-accent-alt/10 blur-3xl"
    />
    <motion.div
      animate={{
        y: [0, -25, 0],
        rotate: [0, 5, 0]
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      className="absolute -bottom-[10%] left-[20%] h-[50vh] w-[50vh] rounded-full bg-clay-info/10 blur-3xl"
    />
  </div>
);

const LoginScreen = ({ onLogin }: { onLogin: (token: string, role: Role, username: string) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Authentication failed');
      }
      
      if (isRegister) {
        setIsRegister(false);
        setError('Registration successful! Please login.');
      } else {
        const data = await res.json();
        const base64Url = data.accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        let role = 'VIEWER';
        if (payload.scopes) {
            role = payload.scopes.replace('ROLE_', '');
        } else if (payload.authorities && payload.authorities.length > 0) {
            role = payload.authorities[0].authority.replace('ROLE_', '');
        }
        
        onLogin(data.accessToken, role as Role, payload.sub);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-clay-foreground font-dmsans p-8">
      <BackgroundBlobs />
      <ClayCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-clay-accent to-clay-accent-alt rounded-[20px] flex items-center justify-center text-white mx-auto shadow-clay-button animate-clay-breathe mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black clay-text-gradient">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-clay-muted mt-2">Sign in to your FinanceFlow account</p>
        </div>
        
        {error && <div className={`p-4 rounded-xl mb-6 text-sm font-bold shadow-clay-pressed ${error.includes('successful') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <ClayInput 
            placeholder="Username" 
            value={username}
            onChange={(e: any) => setUsername(e.target.value)}
            required
          />
          <ClayInput 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />
          <ClayButton type="submit" className="w-full h-16" disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Login')}
          </ClayButton>
        </form>
        
        <p className="text-center mt-8 text-clay-muted font-bold">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="ml-2 text-clay-accent hover:underline">
            {isRegister ? 'Login' : 'Sign up'}
          </button>
        </p>
      </ClayCard>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentRole, setCurrentRole] = useState<Role>('ADMIN');
  const [username, setUsername] = useState<string>('User');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'users'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newTx, setNewTx] = useState({ amount: 0, type: 'EXPENSE', category: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchSummary = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      
      // Adapt Backend Map structure to Frontend Array structure
      if (data.expensesByCategory) {
        data.categoryTotals = Object.entries(data.expensesByCategory).map(([category, total]) => ({
          category,
          total
        }));
      } else {
        data.categoryTotals = [];
      }
      
      setSummary(data);
    } catch (err: any) {
      console.error('Summary fetch error:', err);
      if (err.message === 'Unauthorized') handleLogout();
      setSummary(null);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
          if (res.status === 403) {
            setTransactions([]);
            return;
          }
          throw new Error('Unauthorized');
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    if (currentRole !== 'ADMIN' || !token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Users fetch error:', err);
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const loadData = async () => {
      await Promise.all([
        fetchSummary(),
        fetchTransactions(),
        fetchUsers()
      ]);
      setLoading(false);
    };
    loadData();
  }, [currentRole, token]);

  const handleAddTransaction = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newTx)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTransactions();
      await fetchSummary();
      setNewTx({ amount: 0, type: 'EXPENSE', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTransactions();
      await fetchSummary();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogin = (newToken: string, role: Role, loggedInUser: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentRole(role);
    setUsername(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setSummary(null);
    setTransactions([]);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex text-clay-foreground font-dmsans">
      <BackgroundBlobs />

      {/* Sidebar */}
      <aside className="w-80 p-8 flex flex-col gap-8">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="h-full rounded-[48px] bg-white/60 backdrop-blur-2xl shadow-clay-surface p-8 flex flex-col border border-white/40"
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-clay-accent to-clay-accent-alt rounded-[20px] flex items-center justify-center text-white shadow-clay-button animate-clay-breathe">
              <Wallet size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight clay-text-gradient">FinanceFlow</h1>
          </div>

          <nav className="flex-1 space-y-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all font-nunito font-extrabold ${activeTab === 'dashboard' ? 'bg-clay-accent text-white shadow-clay-button' : 'text-clay-muted hover:bg-white/40'}`}
            >
              <LayoutDashboard size={22} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all font-nunito font-extrabold ${activeTab === 'transactions' ? 'bg-clay-accent text-white shadow-clay-button' : 'text-clay-muted hover:bg-white/40'}`}
            >
              <History size={22} />
              Transactions
            </button>
            {currentRole === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all font-nunito font-extrabold ${activeTab === 'users' ? 'bg-clay-accent text-white shadow-clay-button' : 'text-clay-muted hover:bg-white/40'}`}
              >
                <Users size={22} />
                Users
              </button>
            )}
          </nav>

          <div className="mt-auto pt-8 border-t border-clay-accent/10">
            <ClayButton variant="ghost" onClick={handleLogout} className="w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 justify-start h-12">
              <LogOut size={20} />
              <span className="font-bold">Sign Out</span>
            </ClayButton>
          </div>
        </motion.div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-8 pl-0">
        <header className="h-24 flex items-center justify-between px-8 mb-8">
          <div>
            <h2 className="text-5xl font-black tracking-tight clay-text-gradient capitalize">{activeTab}</h2>
            <p className="text-clay-muted font-medium mt-2">Welcome back, {username}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-3 rounded-[32px] shadow-clay-card border border-white/40"
          >
            <div className="text-right px-4">
              <p className="text-sm font-black text-clay-foreground">{username}</p>
              <p className="text-[10px] font-bold text-clay-accent uppercase tracking-widest">{currentRole}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-clay-info to-clay-accent rounded-full flex items-center justify-center text-white shadow-clay-button">
              <Users size={24} />
            </div>
          </motion.div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-12">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-16 w-16 border-8 border-clay-accent/20 border-t-clay-accent shadow-clay-button"
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-12"
                >
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ClayCard className="bg-emerald-50/40">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-emerald-500 text-white rounded-[20px] shadow-clay-button">
                          <ArrowUpCircle size={28} />
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full shadow-clay-card">UP 12%</span>
                      </div>
                      <p className="text-clay-muted text-sm font-bold uppercase tracking-widest">Total Income</p>
                      <h3 className="text-4xl font-black mt-2 text-emerald-600">${summary?.totalIncome.toLocaleString()}</h3>
                    </ClayCard>

                    <ClayCard className="bg-rose-50/40">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-rose-500 text-white rounded-[20px] shadow-clay-button">
                          <ArrowDownCircle size={28} />
                        </div>
                        <span className="text-xs font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full shadow-clay-card">DOWN 4%</span>
                      </div>
                      <p className="text-clay-muted text-sm font-bold uppercase tracking-widest">Total Expenses</p>
                      <h3 className="text-4xl font-black mt-2 text-rose-600">${summary?.totalExpense.toLocaleString()}</h3>
                    </ClayCard>

                    <ClayCard className="bg-gradient-to-br from-clay-accent to-clay-accent-alt text-white border-none">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-[20px] shadow-clay-button">
                          <TrendingUp size={28} />
                        </div>
                      </div>
                      <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Net Balance</p>
                      <h3 className="text-4xl font-black mt-2">${summary?.netBalance.toLocaleString()}</h3>
                    </ClayCard>
                  </div>

                  {/* Insights & Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Category Breakdown */}
                    <ClayCard>
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-2xl font-black flex items-center gap-3">
                          <PieChart size={24} className="text-clay-accent" />
                          Insights
                        </h4>
                        <ClayButton variant="ghost" className="h-10 px-4 text-xs">View All</ClayButton>
                      </div>
                      {summary ? (
                        <div className="space-y-6">
                          {summary.categoryTotals.map((cat, idx) => (
                            <div key={idx} className="space-y-3">
                              <div className="flex justify-between text-sm font-bold">
                                <span className="text-clay-muted">{cat.category}</span>
                                <span className="text-clay-foreground">${cat.total.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-[#EFEBF5] h-4 rounded-full shadow-clay-pressed overflow-hidden p-1">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((cat.total / summary.totalIncome) * 100, 100)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="bg-gradient-to-r from-clay-accent to-clay-accent-alt h-full rounded-full shadow-clay-button"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-clay-muted">
                          <ShieldCheck size={64} className="mb-6 opacity-20" />
                          <p className="font-bold text-lg">Insights restricted</p>
                          <p className="text-sm opacity-60">Upgrade to Analyst role</p>
                        </div>
                      )}
                    </ClayCard>

                    {/* Recent Activity */}
                    <ClayCard>
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-2xl font-black flex items-center gap-3">
                          <History size={24} className="text-clay-accent" />
                          Activity
                        </h4>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-clay-button" />
                          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-clay-button" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {summary?.recentActivity.map((tx) => (
                          <motion.div
                            key={tx.id}
                            whileHover={{ scale: 1.02, x: 10 }}
                            className="flex items-center justify-between p-5 bg-white/40 rounded-[24px] shadow-clay-card border border-white/20 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-5">
                              <div className={`p-3 rounded-[16px] shadow-clay-button ${tx.type === 'INCOME' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {tx.type === 'INCOME' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                              </div>
                              <div>
                                <p className="font-black text-lg">{tx.category}</p>
                                <p className="text-xs font-bold text-clay-muted uppercase tracking-widest">{tx.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                              </p>
                              <ChevronRight size={16} className="ml-auto text-clay-muted mt-1" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ClayCard>
                  </div>
                </motion.div>
              )}

              {activeTab === 'transactions' && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="space-y-12"
                >
                  {/* Add Transaction Form (Admin Only) */}
                  {currentRole === 'ADMIN' && (
                    <ClayCard className="bg-clay-accent/5">
                      <h4 className="text-2xl font-black mb-8 flex items-center gap-3">
                        <Plus size={24} className="text-clay-accent" />
                        New Entry
                      </h4>
                      <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <ClayInput
                          type="number"
                          placeholder="Amount"
                          value={newTx.amount || ''}
                          onChange={(e: any) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                          required
                        />
                        <div className="relative">
                          <ClaySelect
                            value={newTx.type}
                            onChange={(e: any) => setNewTx({ ...newTx, type: e.target.value as any })}
                          >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                          </ClaySelect>
                        </div>
                        <ClayInput
                          type="text"
                          placeholder="Category"
                          value={newTx.category}
                          onChange={(e: any) => setNewTx({ ...newTx, category: e.target.value })}
                          required
                        />
                        <ClayInput
                          type="date"
                          value={newTx.date}
                          onChange={(e: any) => setNewTx({ ...newTx, date: e.target.value })}
                          required
                        />
                        <ClayButton type="submit" className="h-16">
                          Create
                        </ClayButton>
                      </form>
                    </ClayCard>
                  )}

                  {/* Transaction List */}
                  <div className="space-y-6">
                    {transactions.map(tx => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4 }}
                        className="bg-white/70 backdrop-blur-xl rounded-[32px] p-6 shadow-clay-card border border-white/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-8">
                          <div className="text-center min-w-[80px]">
                            <p className="text-[10px] font-black text-clay-muted uppercase tracking-widest">{tx.date.split('-')[0]}</p>
                            <p className="text-2xl font-black text-clay-accent">{tx.date.split('-')[2]}</p>
                            <p className="text-[10px] font-black text-clay-muted uppercase tracking-widest">MAR</p>
                          </div>
                          <div className="h-12 w-[2px] bg-clay-accent/10 rounded-full" />
                          <div>
                            <h5 className="text-xl font-black">{tx.category}</h5>
                            <p className="text-sm font-bold text-clay-muted">{tx.notes || 'No description'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-clay-pressed ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type}
                            </span>
                            <p className={`text-3xl font-black mt-2 ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString()}
                            </p>
                          </div>

                          {currentRole === 'ADMIN' ? (
                            <ClayButton
                              variant="danger"
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="w-14 h-14 p-0 rounded-full"
                            >
                              <Trash2 size={20} />
                            </ClayButton>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-[#EFEBF5] shadow-clay-pressed flex items-center justify-center text-clay-muted/30">
                              <ShieldCheck size={20} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && currentRole === 'ADMIN' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {users.map(user => (
                    <ClayCard key={user.id} className="group">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-clay-info to-clay-accent rounded-[24px] flex items-center justify-center text-white shadow-clay-button group-hover:animate-clay-breathe">
                          <Users size={32} />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-clay-foreground">{user.username}</h4>
                          <p className="text-xs font-bold text-clay-muted uppercase tracking-widest">ID: FF-{user.id}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-6 border-t border-clay-accent/5">
                        <div className={`px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase shadow-clay-pressed ${user.role === 'ADMIN' ? 'text-clay-accent' : user.role === 'ANALYST' ? 'text-clay-warning' : 'text-clay-muted'}`}>
                          {user.role}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full shadow-clay-button ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-clay-muted'}`} />
                          <span className="text-xs font-black uppercase tracking-widest text-clay-muted">{user.status}</span>
                        </div>
                      </div>
                    </ClayCard>
                  ))}
                  <motion.button
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-4 border-dashed border-clay-accent/20 rounded-[32px] p-8 flex flex-col items-center justify-center text-clay-accent/40 hover:border-clay-accent/40 hover:text-clay-accent/60 transition-all bg-white/20 backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-clay-accent/10 flex items-center justify-center mb-4 shadow-clay-pressed">
                      <Plus size={32} />
                    </div>
                    <span className="text-xl font-black">Add New User</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
