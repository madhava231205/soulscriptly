import { useState } from 'react'


const PasswordSecurity = ({ currentUser }) => {
  
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
const [otp, setOtp] = useState('')
const [otpVerified, setOtpVerified] = useState(false)
const [newPassword, setNewPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [message, setMessage] = useState('')
const [messageType, setMessageType] = useState('')
const [showNewPassword, setShowNewPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)

const showMessage = (text, type) => {
  setMessage(text)
  setMessageType(type)
}
const handleSendOtp = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/auth/change-password/send-otp',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
     showMessage(data.message || 'Could not send OTP', 'error')
      return
    }

    setOtpSent(true)
    showMessage('OTP sent to your registered email!', 'success')
  } catch (error) {
    console.error('Send OTP error:', error)
    showMessage('Something went wrong. Please try again.', 'error')
  }
}
const handleVerifyOtp = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/auth/change-password/verify-otp',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      showMessage(data.message || 'Could not verify OTP', 'error')
      return
    }

    setOtpVerified(true)
    showMessage('OTP verified successfully!', 'success')
  } catch (error) {
    console.error('Verify OTP error:', error)
    showMessage('Something went wrong. Please try again.', 'error')
  }
}
const handleUpdatePassword = async () => {
  if (newPassword.length < 8) {
    showMessage('Password must be at least 8 characters long', 'error')
    return
  }

  if (newPassword !== confirmPassword) {
    showMessage('Passwords do not match', 'error')
    return
  }

  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/auth/change-password/update',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      showMessage(data.message || 'Could not update password', 'error')
      return
    }

    showMessage('Account password changed successfully!', 'success')
setTimeout(() => {
          setMessage('')
        }, 2500)
        
    setShowAccountPassword(false)
    setOtpSent(false)
    setOtp('')
    setOtpVerified(false)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
setShowConfirmPassword(false)
  } catch (error) {
    console.error('Password update error:', error)
    showMessage('Something went wrong. Please try again.', 'error')
  }
}

  return (
    <div className="password-security">
      {!showAccountPassword ? (
        <>
          <h2>Password & Security</h2>
          <p>Manage your account and diary passwords.</p>

          <div className="password-security-options">
            <div className="settings-card">
              <div className="settings-card-icon">🔑</div>
              <h3>Change Account Password</h3>
              <p>
                Secure your SoulScriptly account by updating your login password.
              </p>
              <button
                className="setup-primary-button"
                onClick={() => setShowAccountPassword(true)}
              >
                Change Password
              </button>
            </div>

            <div className="settings-card">
              <div className="settings-card-icon">📔</div>
              <h3>Change Diary Password</h3>
              <p>
                Update the password that protects your private diary.
              </p>
              <button
                className="setup-primary-button"
                onClick={() => {}}
              >
                Change Diary Password
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="account-password-form">
  <h3>Change Account Password</h3>
  {message && (
  <div className={`security-message ${messageType}`}>
    {message}
  </div>
)}

          {!otpSent && (
            <div>
          <p>
  We'll send a verification code to your registered email:
</p>

<p className="security-email">
  {currentUser?.email || 'your email'}
</p>
<button
  className="setup-primary-button"
  onClick={handleSendOtp}
  
>
 Send OTP
</button>
</div>

)}


{otpSent && !otpVerified && (
  <div className="otp-verification">
    <label>Enter the 6-digit OTP</label>

    <input
      type="text"
      maxLength="6"
      value={otp}
      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
      placeholder="Enter OTP"
      inputMode="numeric"
      required
    />
  </div>
)}

{otpSent && !otpVerified && (
  <button
    className="setup-primary-button"
    onClick={handleVerifyOtp}
    disabled={otp.length !== 6}
  >
    Verify OTP
  </button>
)}
{otpVerified && (
  <div className="new-password-fields">
    <label>New Password</label>
    <div className="password-input-wrapper">
    <input
      type={showNewPassword ? 'text' : 'password'}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      placeholder="Enter new password"
    />
    <button
  type="button"
   className="password-visibility-button"
  onClick={() => setShowNewPassword(!showNewPassword)}
>
  {showNewPassword ? 'Hide' : 'Show'}
</button>
</div>

    <label>Confirm New Password</label>
    <div className="password-input-wrapper">
    <input
      type={showConfirmPassword ? 'text' : 'password'}
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      placeholder="Confirm new password"
    />
    <button
  type="button"
   className="password-visibility-button"
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
>
  {showConfirmPassword ? 'Hide' : 'Show'}
</button>
</div>
  </div>
)}
{otpVerified && (
  <button
    className="setup-primary-button"
    onClick={handleUpdatePassword}
    disabled={!newPassword || !confirmPassword}
  >
    Update Password
  </button>
)}
{message && (
        <div className="toast-message">

          <div className="toast-icon">
            ✓
          </div>

          <div>
            <strong>{message}</strong>
            
          </div>

          <button
            onClick={() => setMessage('')}
          >
            ×
          </button>

        </div>
      )}
          
        </div>
      )}
    </div>
  )
}

export default PasswordSecurity