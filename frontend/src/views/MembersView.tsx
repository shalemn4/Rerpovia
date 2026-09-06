import React from 'react';
import { Users, Shield, UserPlus, Mail } from 'lucide-react';

export const MembersView: React.FC = () => {
  const members = [
    { name: 'Dr. Helena Vance', email: 'h.vance@cern.ch', role: 'OWNER', team: 'EP-SFT Experimental Physics', joined: '2026-01-15' },
    { name: 'Dr. Marcus Thorne', email: 'm.thorne@cern.ch', role: 'RESEARCHER', team: 'ATLAS Higgs Analysis', joined: '2026-02-01' },
    { name: 'Elena Rostova', email: 'e.rostova@cern.ch', role: 'DEVELOPER', team: 'Computing Infrastructure', joined: '2026-03-12' },
    { name: 'Prof. David Chen', email: 'd.chen@cern.ch', role: 'VIEWER', team: 'External Academic Reviewer', joined: '2026-04-05' }
  ];

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

        <button className="btn-reprovia-primary">
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
                <th>CERN Email</th>
                <th>Organization Team</th>
                <th>Assigned Role</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
