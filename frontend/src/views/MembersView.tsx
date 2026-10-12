import React, { useEffect, useState } from 'react';
import { Users, Shield, UserPlus, Mail, X, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { MemberItem } from '../types';

export const MembersView: React.FC = () => {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invite state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RESEARCHER');
  const [institution, setInstitution] = useState('CERN EP-SFT');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await api.listMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.inviteMember({
        name,
        email,
        role,
        institution
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      await loadMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to invite member.');
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    { role: 'OWNER', color: 'var(--navy-900)', desc: 'Full administrative control, cluster execution, secrets, and member management.' },
    { role: 'RESEARCHER', color: 'var(--electric-blue)', desc: 'Can create, execute, reproduce workflows and publish datasets.' },
    { role: 'DEVELOPER', color: '#6366f1', desc: 'Can build workflows and configure container environments.' },
    { role: 'VIEWER', color: 'var(--navy-muted)', desc: 'Read-only access to published workflows, results, and provenance records.' }
  ];

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)', fontWeight: 600, letterSpacing: '0.08em' }}>
            ORGANIZATION MEMBERS & ACCESS CONTROL
          </div>
          <h2 className="h2-editorial">Members & RBAC Roles</h2>
        </div>

        <button className="btn-reprovia-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={14} />
          <span>Invite Researcher</span>
        </button>
      </div>

      {/* Roles Specification Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {roles.map((r) => (
          <div key={r.role} className="arch-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge-arch" style={{ background: 'var(--bg-cream-alt)', fontWeight: 700, color: r.color }}>
                {r.role}
              </span>
              <Shield size={14} color={r.color} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--navy-600)', lineHeight: 1.4 }}>
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="arch-card">
        <div className="arch-card-header">
          <span className="arch-card-title">
            <Users size={14} />
            <span>Active Project Members ({members.length})</span>
          </span>
          <span className="badge-arch badge-matched">MFA ENFORCED</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="arch-table">
            <thead>
              <tr>
                <th>Researcher Name</th>
                <th>CERN / Work Email</th>
                <th>Organization Team</th>
                <th>Assigned Role</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--navy-muted)' }}>
                    {loading ? 'Loading members...' : 'No members registered.'}
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.email}>
                    <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                      {m.name}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--navy-muted)' }}>
                      {m.email}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--navy-700)' }}>
                      {m.team}
                    </td>
                    <td>
                      <span className="badge-arch" style={{ background: 'var(--bg-cream-alt)', fontWeight: 700 }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)' }}>
                      {m.joined}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Researcher Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(8, 17, 30, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
        >
          <div
            className="arch-card"
            style={{
              width: '500px',
              maxWidth: '95vw',
              background: '#ffffff',
              boxShadow: '12px 12px 0px rgba(12, 25, 44, 0.95)'
            }}
          >
            <div className="arch-card-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} color="var(--electric-blue)" />
                <span className="arch-card-title">Invite Researcher to Project</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMsg && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', fontSize: '12px', borderRadius: '2px' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Marcus Thorne"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-body)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="m.thorne@cern.ch"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                    RBAC ROLE
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--bg-cream-alt)' }}
                  >
                    <option value="RESEARCHER">RESEARCHER</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--navy-muted)', display: 'block', marginBottom: '4px' }}>
                    TEAM / INSTITUTION
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--navy-800)', fontFamily: 'var(--font-body)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-reprovia-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-reprovia-primary" disabled={submitting}>
                  {submitting ? 'Sending Provisioning...' : 'Provision Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
