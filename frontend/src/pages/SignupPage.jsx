import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Loader2, ArrowRight, ArrowLeft, Briefcase, Building, BarChart3, Users } from 'lucide-react';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New profile and workspace fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('Marketer');
  const [monthlyVolume, setMonthlyVolume] = useState('< 1,000');
  const [workspaceName, setWorkspaceName] = useState('');

  const [processing, setProcessing] = useState(false);

  const { signup } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

  // Auto-fill workspace name when name changes
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!workspaceName || workspaceName === `${name}'s Workspace`) {
      setWorkspaceName(value ? `${value}'s Workspace` : '');
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      notify('Please fill in all credentials fields', 'error');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{6,}$/;
    if (!passwordRegex.test(password)) {
      notify('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#._-)', 'error');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      notify('Please fill in all credentials fields', 'error');
      setStep(1);
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{6,}$/;
    if (!passwordRegex.test(password)) {
      notify('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#._-)', 'error');
      setStep(1);
      return;
    }

    setProcessing(true);
    const result = await signup(
      name, 
      email, 
      password, 
      companyName, 
      jobTitle, 
      monthlyVolume, 
      workspaceName || `${name}'s Workspace`
    );
    setProcessing(false);

    if (result && result.success) {
      notify('Welcome! Your SnipURL account and default workspace were created successfully.', 'success');
      navigate('/dashboard');
    } else {
      notify(result?.error || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative overflow-hidden min-h-[500px] flex flex-col justify-between">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
            Step {step} of 2
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {step === 1 ? 'Account Credentials' : 'Profile & Workspace Setup'}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-outfit text-slate-900 dark:text-white transition-all">
          {step === 1 ? 'Create Your Account' : 'Setup Your Profile'}
        </h1>
        <p className="text-slate-400 text-xs mt-1 leading-normal">
          {step === 1 
            ? 'Begin building and tracking premium branded links.' 
            : 'Help us customize your workspace and tracking experience.'}
        </p>
      </div>

      {/* Forms with Slide Transition */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleNextStep}
              className="space-y-4"
            >
              {/* Full Name Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Jane Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white transition-all placeholder:text-slate-400 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@company.com"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white transition-all placeholder:text-slate-400 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (Min. 6 chars)"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white transition-all placeholder:text-slate-400 font-semibold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all duration-205 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 mt-6"
              >
                Continue Setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Organization/Company Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* Job Role / Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Your Role
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                    <select
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:outline-none text-xs text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Marketer">Marketer</option>
                      <option value="Developer">Developer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Founder/CEO">Founder / CEO</option>
                      <option value="Analyst">Data Analyst</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Monthly Link Volume */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Estimated Monthly Clicks
                </label>
                <div className="relative">
                  <BarChart3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:outline-none text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="< 1,000">Less than 1,000 clicks/mo</option>
                    <option value="1,000 - 10,000">1,000 - 10,000 clicks/mo</option>
                    <option value="10,000 - 100,000">10,000 - 100,000 clicks/mo</option>
                    <option value="> 100,000">Over 100,000 clicks/mo</option>
                  </select>
                </div>
              </div>

              {/* Default Workspace Setup */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Default Workspace Name
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. My Team Workspace"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070a13] border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Step Navigation Button Strip */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      Complete Sign Up
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle View Link */}
      <div className="text-center mt-6 text-xs text-slate-450 border-t border-slate-100 dark:border-white/[0.03] pt-4">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
        >
          Sign in instead
        </Link>
      </div>
    </div>
  );
};

export default SignupPage;
