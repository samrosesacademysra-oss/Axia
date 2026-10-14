import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Database,
  ExternalLink,
  Info,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getSupabaseConfigStatus, isSupabaseConfigured } from '../../lib/supabase/client';
import { localDb } from '../../services/dbStorage';

export function SettingsView() {
  const { user } = useAuth();
  const { refreshData } = useData();
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const configStatus = getSupabaseConfigStatus();

  const handleCopyEnv = () => {
    const envText = `VITE_SUPABASE_URL="https://your-project-id.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-public-key"`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleLoadStarterData = () => {
    localDb.seedSampleData();
    refreshData();
    setActionMessage('Opening inventory from the stock sheet has been loaded.');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear local preview database records?')) {
      localDb.clearAll();
      refreshData();
      setActionMessage('All local preview data has been reset to an empty state.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
          System Architecture & Settings
        </h1>
        <p className="text-xs md:text-sm text-stone-500 mt-0.5">
          Configuration, Cursor & Supabase database integration instructions, and admin credentials.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Supabase Connection Status Card */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-950 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Supabase Backend Infrastructure
              </h2>
              <p className="text-xs text-stone-500">
                PostgreSQL Database & Authentication Service Layer
              </p>
            </div>
          </div>

          <div>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Connected Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Ready for Cursor Connection
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block mb-1">Configured Supabase URL:</span>
            <span className="font-mono font-semibold text-stone-800 truncate block">
              {configStatus.url || 'Not set (using clean decoupled data layer)'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block mb-1">Public Anon API Key:</span>
            <span className="font-mono font-semibold text-stone-800 block">
              {configStatus.hasKey ? 'Configured in environment' : 'Not set (no secrets exposed)'}
            </span>
          </div>
        </div>

        {/* Cursor Supabase Integration Guide */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-3">
          <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-stone-700" />
            Connecting Supabase in Cursor
          </h3>
          <p className="text-stone-600 leading-relaxed">
            The frontend has been built with an isolated Supabase service layer in{' '}
            <code className="bg-stone-200/80 px-1 rounded text-stone-800">/src/services/</code>{' '}
            and strict TypeScript database types in{' '}
            <code className="bg-stone-200/80 px-1 rounded text-stone-800">/src/types/database.ts</code>.
          </p>

          <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1">
            <li>
              In Cursor, open your project and ensure your{' '}
              <code className="bg-stone-200/80 px-1 rounded">.env</code> contains your project's URL and anon key.
            </li>
            <li>
              Run the SQL migration located at{' '}
              <code className="bg-stone-200/80 px-1 rounded font-semibold text-stone-900">
                /supabase/schema.sql
              </code>{' '}
              in your Supabase SQL Editor.
            </li>
            <li>
              All six tables (<code className="text-stone-800 font-mono">products</code>,{' '}
              <code className="text-stone-800 font-mono">customers</code>,{' '}
              <code className="text-stone-800 font-mono">sales</code>,{' '}
              <code className="text-stone-800 font-mono">sale_items</code>,{' '}
              <code className="text-stone-800 font-mono">payments</code>,{' '}
              <code className="text-stone-800 font-mono">stock_movements</code>) will automatically link.
            </li>
          </ol>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopyEnv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-800 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedEnv ? 'Copied .env Template!' : 'Copy .env Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Admin User Information */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-stone-700" />
          Active Administrator Session
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block mb-0.5">Admin Name</span>
            <span className="font-semibold text-stone-900">{user?.name || 'Administrator'}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block mb-0.5">Admin Email</span>
            <span className="font-semibold text-stone-900">{user?.email || 'admin@axiadistributions.com'}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-stone-500 block mb-0.5">Security Role</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Full System Admin
            </span>
          </div>
        </div>
      </div>

      {/* Data Management for Demo / Preview */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-stone-700" />
          Preview Data Management
        </h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          While Supabase is being configured via Cursor, the system persists data in your local browser sandbox. You can populate starter items for testing or reset to empty states.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleLoadStarterData}
            className="px-3.5 py-2 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Load opening inventory
          </button>

          <button
            type="button"
            onClick={handleClearData}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Data to Empty State
          </button>
        </div>
      </div>
    </div>
  );
}
