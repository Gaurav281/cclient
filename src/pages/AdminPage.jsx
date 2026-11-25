import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi.js';
import { tournamentApi } from '../api/tournamentApi.js';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Trophy,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Check,
  X,
  ArrowLeft,
  Trash2,
  Send,
  Megaphone,
  MessageSquare,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments' | 'deposits' | 'withdrawals' | 'settings'

  // Tournament creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    entryFee: 0,
    totalParticipantsAllowed: 20,
    winnerCount: 3,
    rewards: [50, 30, 20],
    turnsPerUser: 3,
    durationHours: 24,
  });

  // Admin UPI settings state
  const [upiSettings, setUpiSettings] = useState({
    upiId: '',
    upiName: '',
  });

  // Admin Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    buttonText: '🎮 Play Firefly',
  });
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  // Required Telegram chats state
  const [showAddChatModal, setShowAddChatModal] = useState(false);
  const [chatForm, setChatForm] = useState({
    title: '',
    type: 'channel',
    link: '',
    isActive: true,
  });

  // Queries
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  });

  const { data: tournamentsData, refetch: refetchTournaments } = useQuery({
    queryKey: ['adminTournaments'],
    queryFn: tournamentApi.getTournaments,
  });

  const { data: depositsData, refetch: refetchDeposits } = useQuery({
    queryKey: ['adminDeposits'],
    queryFn: () => adminApi.getTransactions({ type: 'DEPOSIT' }),
  });

  const { data: withdrawalsData, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: () => adminApi.getTransactions({ type: 'WITHDRAWAL' }),
  });

  const { data: requiredChatsData, refetch: refetchRequiredChats } = useQuery({
    queryKey: ['adminRequiredChats'],
    queryFn: adminApi.getRequiredChats,
  });
  const adminChats = requiredChatsData?.chats || [];

  // Mutations
  const createTournamentMutation = useMutation({
    mutationFn: adminApi.createTournament,
    onSuccess: () => {
      toast.success('Tournament created!');
      setShowCreateModal(false);
      refetchTournaments();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to create'),
  });

  const declareResultMutation = useMutation({
    mutationFn: adminApi.declareResult,
    onSuccess: (res) => {
      toast.success(res.message || 'Results declared!');
      refetchTournaments();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to declare results'),
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (tournamentId) => adminApi.deleteTournament(tournamentId),
    onSuccess: (res) => {
      toast.success(res.message || 'Tournament deleted!');
      refetchTournaments();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete tournament'),
  });

  const handleDeleteTournament = (t) => {
    if (window.confirm(`Delete "${t.title}"? This cannot be undone.`)) {
      deleteTournamentMutation.mutate(t._id);
    }
  };

  const approveDepositMutation = useMutation({
    mutationFn: ({ id, remarks }) => adminApi.approveDeposit(id, remarks),
    onSuccess: () => {
      toast.success('Deposit approved!');
      refetchDeposits();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => toast.error(err.message || 'Approval failed'),
  });

  const rejectDepositMutation = useMutation({
    mutationFn: ({ id, remarks }) => adminApi.rejectDeposit(id, remarks),
    onSuccess: () => {
      toast.success('Deposit rejected');
      refetchDeposits();
    },
    onError: (err) => toast.error(err.message || 'Rejection failed'),
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: ({ id, remarks }) => adminApi.approveWithdrawal(id, remarks),
    onSuccess: () => {
      toast.success('Withdrawal approved!');
      refetchWithdrawals();
      refetchStats();
    },
    onError: (err) => toast.error(err.message || 'Approval failed'),
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ id, remarks }) => adminApi.rejectWithdrawal(id, remarks),
    onSuccess: () => {
      toast.success('Withdrawal rejected');
      refetchWithdrawals();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => toast.error(err.message || 'Rejection failed'),
  });

  const updateUpiMutation = useMutation({
    mutationFn: () => adminApi.updateUpiConfig(upiSettings.upiId, upiSettings.upiName),
    onSuccess: () => {
      toast.success('UPI updated!');
      refetchStats();
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });

  const broadcastMutation = useMutation({
    mutationFn: () =>
      adminApi.broadcastMessage(broadcastForm.message, broadcastForm.buttonText),
    onSuccess: (res) => {
      toast.success(res.message || 'Broadcast message sent!');
      setBroadcastStatus(res);
      setBroadcastForm({ message: '', buttonText: '🎮 Play Firefly' });
    },
    onError: (err) => toast.error(err.message || 'Failed to send broadcast'),
  });

  const createChatMutation = useMutation({
    mutationFn: adminApi.createRequiredChat,
    onSuccess: () => {
      toast.success('Required Telegram link added!');
      setShowAddChatModal(false);
      setChatForm({ title: '', type: 'channel', link: '', chatUsernameOrId: '', isActive: true });
      refetchRequiredChats();
      queryClient.invalidateQueries({ queryKey: ['requiredChats'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to add Telegram link'),
  });

  const deleteChatMutation = useMutation({
    mutationFn: adminApi.deleteRequiredChat,
    onSuccess: () => {
      toast.success('Telegram link removed');
      refetchRequiredChats();
      queryClient.invalidateQueries({ queryKey: ['requiredChats'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  const handleWinnerCountChange = (count) => {
    const num = Number(count);
    let newRewards = [...form.rewards];
    if (num === 1) newRewards = [form.rewards[0] || 50];
    if (num === 2) newRewards = [form.rewards[0] || 50, form.rewards[1] || 30];
    if (num === 3) newRewards = [form.rewards[0] || 50, form.rewards[1] || 30, form.rewards[2] || 20];

    setForm({
      ...form,
      winnerCount: num,
      rewards: newRewards,
    });
  };

  const handleCreateTournament = (e) => {
    e.preventDefault();
    createTournamentMutation.mutate(form);
  };

  const stats = statsData?.stats || {};
  const tournaments = tournamentsData?.tournaments || [];
  const deposits = depositsData?.transactions || [];
  const withdrawals = withdrawalsData?.transactions || [];

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg bg-[#141414] border border-white/10 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-400" />
            <h2 className="font-heading font-bold text-sm text-white">Admin Control</h2>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-1.5 px-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs flex items-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Tournament
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10">
          <span className="text-[10px] uppercase font-medium text-neutral-400 block">Users</span>
          <span className="font-heading font-bold text-lg text-white">{stats.totalUsers || 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10">
          <span className="text-[10px] uppercase font-medium text-neutral-400 block">Active</span>
          <span className="font-heading font-bold text-lg text-sky-400">{stats.activeTournaments || 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10">
          <span className="text-[10px] uppercase font-medium text-neutral-400 block">Pending Deposits</span>
          <span className="font-heading font-bold text-lg text-amber-400">{stats.pendingDeposits || 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10">
          <span className="text-[10px] uppercase font-medium text-neutral-400 block">Pending Withdrawals</span>
          <span className="font-heading font-bold text-lg text-red-400">{stats.pendingWithdrawals || 0}</span>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0E0E0E] border border-white/10 overflow-x-auto">
        {[
          { id: 'tournaments', label: 'Tournaments', count: tournaments.length },
          { id: 'deposits', label: 'Deposits', count: stats.pendingDeposits },
          { id: 'withdrawals', label: 'Withdrawals', count: stats.pendingWithdrawals },
          { id: 'channels', label: 'Join Links', count: adminChats.length },
          { id: 'settings', label: 'Settings' },
          { id: 'broadcast', label: 'Broadcast' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-heading font-medium text-xs whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
              activeTab === tab.id
                ? 'bg-sky-400 text-black font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[9px] flex items-center justify-center text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div className="space-y-2">
          {tournaments.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0E0E0E] border border-white/10 text-center text-neutral-500 text-xs">
              No tournaments
            </div>
          ) : (
            tournaments.map((t) => (
              <div
                key={t._id}
                className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-bold text-white text-xs">{t.title}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Entry: ₹{t.entryFee} • {t.currentParticipantsCount}/{t.totalParticipantsAllowed} Racers • {t.turnsPerUser} Turns
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      t.status === 'DECLARED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-sky-400/10 text-sky-400 border-sky-400/20'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                  {t.rewards?.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#141414] border border-white/5 text-[10px]">
                      #{i + 1}: ₹{r}
                    </span>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/tournament/${t._id}`)}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    Leaderboard
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteTournament(t)}
                      disabled={deleteTournamentMutation.isPending}
                      className="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-heading font-bold text-[11px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>

                    {t.status !== 'DECLARED' && (
                      <button
                        onClick={() => declareResultMutation.mutate(t._id)}
                        disabled={declareResultMutation.isPending}
                        className="py-1 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-heading font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                      >
                        <Trophy className="w-3 h-3" /> Declare Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: DEPOSITS */}
      {activeTab === 'deposits' && (
        <div className="space-y-2">
          {deposits.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0E0E0E] border border-white/10 text-center text-neutral-500 text-xs">
              No deposit requests
            </div>
          ) : (
            deposits.map((d) => (
              <div
                key={d._id}
                className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-sm text-emerald-400">
                        ₹{d.amount}
                      </span>
                    </div>
                    <p className="text-[11px] text-white font-medium mt-0.5">
                      User: {d.userId?.username ? `@${d.userId.username}` : d.userId?.firstName || 'Racer'}{' '}
                      <span className="text-neutral-500 font-mono text-[10px]">(TG: {d.userId?.telegramId})</span>
                    </p>
                    <p className="text-[10px] font-mono text-sky-400 mt-0.5 select-all bg-[#141414] px-1.5 py-0.5 rounded inline-block">
                      UTR: {d.paymentDetails?.transactionId || 'N/A'}
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      d.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : d.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {d.status === 'PENDING' && (
                  <div className="pt-1.5 border-t border-white/5 flex items-center gap-2">
                    <button
                      onClick={() => approveDepositMutation.mutate({ id: d._id })}
                      disabled={approveDepositMutation.isPending}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Reason:') || 'Invalid';
                        rejectDepositMutation.mutate({ id: d._id, remarks: reason });
                      }}
                      disabled={rejectDepositMutation.isPending}
                      className="py-1.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0E0E0E] border border-white/10 text-center text-neutral-500 text-xs">
              No withdrawal requests
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w._id}
                className="p-3 rounded-xl bg-[#0E0E0E] border border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-heading font-bold text-sm text-red-400">
                      ₹{w.amount}
                    </span>
                    <p className="text-[11px] text-white font-medium mt-0.5">
                      User: {w.userId?.username ? `@${w.userId.username}` : w.userId?.firstName || 'Racer'}
                    </p>
                    <p className="text-[10px] font-mono text-sky-400 mt-0.5 select-all bg-[#141414] px-1.5 py-0.5 rounded inline-block">
                      UPI: {w.paymentDetails?.upiId}
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      w.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : w.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                {w.status === 'PENDING' && (
                  <div className="pt-1.5 border-t border-white/5 flex items-center gap-2">
                    <button
                      onClick={() => approveWithdrawalMutation.mutate({ id: w._id })}
                      disabled={approveWithdrawalMutation.isPending}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Reason:') || 'Rejected';
                        rejectWithdrawalMutation.mutate({ id: w._id, remarks: reason });
                      }}
                      disabled={rejectWithdrawalMutation.isPending}
                      className="py-1.5 px-3 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & UPI */}
      {activeTab === 'settings' && (
        <div className="p-4 rounded-xl bg-[#0E0E0E] border border-white/10 space-y-3">
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                Receiving UPI ID
              </label>
              <input
                type="text"
                placeholder={stats.upiId || 'fireflypay@upi'}
                value={upiSettings.upiId}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                Merchant Business Name
              </label>
              <input
                type="text"
                placeholder={stats.upiName || 'Firefly Car Tournament'}
                value={upiSettings.upiName}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              onClick={() => updateUpiMutation.mutate()}
              disabled={updateUpiMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wider transition active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB: REQUIRED JOIN LINKS (join.jpg) */}
      {activeTab === 'channels' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-sky-400" />
              <span>Mandatory Join Links ({adminChats.length})</span>
            </h3>
            <button
              onClick={() => setShowAddChatModal(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Link</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 space-y-1">
            <p className="font-semibold text-white">💡 Verification Guidance:</p>
            <p className="text-[11px] text-sky-200/80 leading-relaxed">
              When users open the app, they must join these links. For automatic Telegram membership check, make <span className="font-mono text-white font-bold">@FireflyPlayBot</span> an admin in your Telegram channel or group.
            </p>
          </div>

          {adminChats.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0E0E0E] border border-white/10 text-center text-neutral-500 text-xs">
              No mandatory join links configured yet. Users can access the app directly.
            </div>
          ) : (
            adminChats.map((chat) => (
              <div
                key={chat._id}
                className="p-3.5 rounded-xl bg-[#0E0E0E] border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 shrink-0">
                    {chat.type === 'group' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : chat.type === 'bot' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-white text-xs truncate">
                      {chat.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{chat.type}</span>
                      <span>•</span>
                      <a
                        href={chat.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline flex items-center gap-0.5 truncate"
                      >
                        <span>{chat.link}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete join requirement "${chat.title}"?`)) {
                      deleteChatMutation.mutate(chat._id);
                    }
                  }}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: BROADCAST TO BOT USERS */}
      {activeTab === 'broadcast' && (
        <div className="p-4 rounded-xl bg-[#0E0E0E] border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">Broadcast Message</h3>
              <p className="text-[11px] text-neutral-400">
                Send a notification to all registered bot users on Telegram with a Mini App button.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!broadcastForm.message.trim()) {
                toast.error('Please enter a message to broadcast');
                return;
              }
              if (window.confirm('Send this broadcast message to all Telegram bot users?')) {
                broadcastMutation.mutate();
              }
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                Message Content (Markdown supported)
              </label>
              <textarea
                rows={4}
                value={broadcastForm.message}
                onChange={(e) =>
                  setBroadcastForm({ ...broadcastForm, message: e.target.value })
                }
                placeholder="🔥 New Grand Prix Tournament is LIVE! Join now to race, collect diamonds, and win cash prizes! 🏎️💨"
                className="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-sky-400 resize-none font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                Button Label (Opens Mini App)
              </label>
              <input
                type="text"
                value={broadcastForm.buttonText}
                onChange={(e) =>
                  setBroadcastForm({ ...broadcastForm, buttonText: e.target.value })
                }
                placeholder="🎮 Play Firefly"
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Message Preview */}
            {broadcastForm.message && (
              <div className="p-3 rounded-xl bg-[#090909] border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Preview (How users see it in Telegram)
                </span>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/5 space-y-2.5 text-xs text-neutral-200 whitespace-pre-wrap">
                  {broadcastForm.message}
                  <div className="pt-1">
                    <div className="w-full py-1.5 rounded-lg bg-sky-400/20 border border-sky-400/40 text-sky-300 font-heading font-bold text-center text-xs">
                      {broadcastForm.buttonText || '🎮 Play Firefly'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Feedback */}
            {broadcastStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Broadcast Delivered
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Targeted: {broadcastStatus.totalTargeted} | Delivered: {broadcastStatus.sentCount} | Failed: {broadcastStatus.failedCount}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={broadcastMutation.isPending || !broadcastForm.message.trim()}
              className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 fill-black" />
              <span>
                {broadcastMutation.isPending ? 'Sending Broadcast...' : 'Send Broadcast to All Bot Users'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#0E0E0E] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-heading font-bold text-sm text-white">Create Tournament</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midnight Speed Rush"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                    Entry Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.entryFee}
                    onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                    Racers Capacity
                  </label>
                  <input
                    type="number"
                    min="2"
                    required
                    value={form.totalParticipantsAllowed}
                    onChange={(e) =>
                      setForm({ ...form, totalParticipantsAllowed: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                    Winners (1, 2, or 3)
                  </label>
                  <select
                    value={form.winnerCount}
                    onChange={(e) => handleWinnerCountChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value={1}>1 Winner</option>
                    <option value={2}>2 Winners</option>
                    <option value={3}>3 Winners</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                    Turns Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.turnsPerUser}
                    onChange={(e) => setForm({ ...form, turnsPerUser: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Rewards */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                  Rewards (₹)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: form.winnerCount }).map((_, idx) => (
                    <div key={idx}>
                      <span className="text-[9px] text-neutral-400 block mb-0.5">
                        #{idx + 1}
                      </span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.rewards[idx] || 0}
                        onChange={(e) => {
                          const updated = [...form.rewards];
                          updated[idx] = Number(e.target.value);
                          setForm({ ...form, rewards: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <button
                type="submit"
                disabled={createTournamentMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wider transition active:scale-95"
              >
                {createTournamentMutation.isPending ? 'Launching...' : 'Launch Tournament'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD REQUIRED CHAT MODAL */}
      {showAddChatModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#0E0E0E] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-heading font-bold text-sm text-white">Add Telegram Join Requirement</h3>
              <button
                onClick={() => setShowAddChatModal(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createChatMutation.mutate(chatForm);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  Title / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Firefly Official Channel"
                  value={chatForm.title}
                  onChange={(e) => setChatForm({ ...chatForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  Type
                </label>
                <select
                  value={chatForm.type}
                  onChange={(e) => setChatForm({ ...chatForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                >
                  <option value="channel">Channel (📢)</option>
                  <option value="group">Group / Chat (👥)</option>
                  <option value="bot">Bot (🤖)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                  Telegram Link
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://t.me/YourChannelOrBot"
                  value={chatForm.link}
                  onChange={(e) => setChatForm({ ...chatForm, link: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <button
                type="submit"
                disabled={createChatMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wider transition active:scale-95 disabled:opacity-50"
              >
                {createChatMutation.isPending ? 'Adding Link...' : 'Save Join Requirement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
