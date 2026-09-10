function Sidebar({
  activePage,
  setActivePage,
  handleLogout,
}) {
  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <div className="brand-icon">✦</div>

        <div>
          <h1>SoulScriptly</h1>
          <p>Your thoughts. Your story.</p>
        </div>
      </div>

      <nav className="sidebar-nav">

        <button
          className={
            activePage === 'notes'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActivePage('notes')}
        >
          <span>▣</span>
          <span>Notes</span>
        </button>

        <button
          className={
            activePage === 'diary'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActivePage('diary')}
        >
          <span>▤</span>
          <span>Diary</span>
        </button>

        <button
          className={
            activePage === 'favourites'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActivePage('favourites')}
        >
          <span>★</span>
          <span>Favourites</span>
        </button>

        <button
          className={
            activePage === 'settings'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActivePage('settings')}
        >
          <span>⚙</span>
          <span>Settings</span>
        </button>

        <button
          className={
            activePage === 'profile'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActivePage('profile')}
        >
          <span>●</span>
          <span>Profile</span>
        </button>

      </nav>

      <div className="sidebar-bottom">
        <p>Small notes.</p>
        <p>Big dreams. ♥</p>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

    </aside>
  )
}

export default Sidebar