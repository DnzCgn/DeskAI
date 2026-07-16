import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import FadeIn from '../components/FadeIn';
import RequireRole from '../components/RequireRole';

const ROLE_COLORS = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  company_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  department_manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  team_lead: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  employee: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  auditor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function Users() {
  return (
    <RequireRole roles={['owner', 'company_admin', 'department_manager']}>
      <UsersContent />
    </RequireRole>
  );
}

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');

  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setError('');
    try {
      await api.post('/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Invitation failed');
    }
    setInviting(false);
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h2 className="text-2xl font-semibold text-white">Users</h2>
        <p className="text-zinc-400 mt-1">Manage organization members and roles</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form onSubmit={handleInvite} className="flex gap-3 items-end p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Invite user</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              <option value="employee">Employee</option>
              <option value="team_lead">Team Lead</option>
              <option value="department_manager">Dept Manager</option>
              <option value="company_admin">Company Admin</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={inviting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </motion.button>
        </form>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 text-left">
                  <th className="px-6 py-4 text-zinc-400 font-medium">User</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Role</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Mode</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Status</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">MFA</th>
                  <th className="px-6 py-4 text-zinc-400 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      {error || 'No users found'}
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <motion.tr
                      key={u._id || u.email}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {u.email[0].toUpperCase()}
                          </div>
                          <span className="text-white truncate max-w-[180px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.employee}`}>
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 capitalize">{u.mode}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.offboarded ? 'text-red-400' : 'text-emerald-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.offboarded ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {u.offboarded ? 'Offboarded' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{u.mfaEnabled ? 'Enabled' : '—'}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
