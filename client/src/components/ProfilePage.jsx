
function ProfilePage({ currentUser }) {
  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal information.</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {currentUser?.name
            ? currentUser.name.charAt(0).toUpperCase()
            : 'U'}
        </div>

        <h3>{currentUser?.name || 'Your Name'}</h3>
        <p>{currentUser?.email || 'Your Email'}</p>
      </div>
    </div>
  )
}

export default ProfilePage
