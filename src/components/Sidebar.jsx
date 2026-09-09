import { LogoutIcon } from '../icons/icons'

function initialsFor(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
  return trimmed.slice(0, 2).toUpperCase()
}

const NAV_ITEMS = [
  {
    view: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    view: 'queue',
    label: 'My Queue',
    countKey: 'queue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    view: 'inreview',
    label: 'In Review',
    countKey: 'inreview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    view: 'exceptions',
    label: 'Exceptions',
    countKey: 'exceptions',
    exceptions: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
  },
  {
    view: 'processed',
    label: 'Processed Payment',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
]

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  currentView,
  onNavigate,
  counts,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyDateFilter,
  onAnalyticsClick,
  userId,
  onLogout,
}) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="mark">AP</div>
        <div className="logo-text">
          <div className="name">AP SmartFlow AI</div>
          <div className="sub">Accounts Payable</div>
        </div>
      </div>

      <div className="nav-section">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.view}
            className={`nav-item${item.exceptions ? ' exceptions' : ''}${currentView === item.view ? ' active' : ''}`}
            title={item.label}
            onClick={() => onNavigate(item.view)}
          >
            {item.icon}
            <span className="label">{item.label}</span>
            {item.countKey && <span className="count">{counts[item.countKey]}</span>}
          </div>
        ))}
        <div className="nav-item" title="Analytics" onClick={onAnalyticsClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <span className="label">Analytics</span>
        </div>
      </div>

      <div className="nav-divider"></div>
      <div className="nav-label">Date Range</div>
      <div className="date-filter-block">
        <div className="date-row">
          <input
            type="date"
            className="date-input"
            title="From date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
          <span className="date-sep">–</span>
          <input
            type="date"
            className="date-input"
            title="To date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
        <button className="apply-filter-btn" onClick={onApplyDateFilter}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4h18M6 4v16M18 4v16M3 10h18M3 16h18" />
          </svg>
          Apply
        </button>
      </div>

      <div className="sidebar-spacer"></div>
      <div className="sidebar-user" title={userId}>
        <div className="avatar">{initialsFor(userId)}</div>
        <div className="user-text">
          <div className="uname">{userId}</div>
          <div className="urole">AP Manager</div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign out">
          <LogoutIcon />
        </button>
      </div>
      <button className="collapse-btn" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleCollapse}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
          <path d="M4 4v16" />
        </svg>
        <span className="label">Collapse</span>
      </button>
    </aside>
  )
}
