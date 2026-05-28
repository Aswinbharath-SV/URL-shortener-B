import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const { login } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notify('Please fill in all fields', 'error');
      return;
    }

    setProcessing(true);
    const result = await login(email, password);
    setProcessing(false);

    if (result && result.success) {
      notify('Welcome back! Logged in successfully.', 'success');
      navigate('/dashboard');
    } else {
      notify(result?.error || 'Login failed. Please check credentials.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">
          Sign In
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Access your SnipURL workspace dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@company.com"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={processing}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 mt-6"
        >
          {processing ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              Verifying credentials...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          )}
        </button>
      </form>

      {/* Toggle View Link */}
      <div className="text-center mt-6 text-xs text-slate-400">
        Don't have an account yet?{' '}
        <Link
          to="/signup"
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Create an account
        </Link>
      </div>
    </motion.div>
  );
};

export default LoginPage;
