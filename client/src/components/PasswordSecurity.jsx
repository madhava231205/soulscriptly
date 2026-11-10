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
const [showDiaryPinReset, setShowDiaryPinReset] = useState(false)
const [diaryOtpSent, setDiaryOtpSent] = useState(false)
const [diaryOtp, setDiaryOtp] = useState('')
const [diaryOtpVerified, setDiaryOtpVerified] = useState(false)
const [newDiaryPin, setNewDiaryPin] = useState('')
const [confirmDiaryPin, setConfirmDiaryPin] = useState('')

const showMessage = (text, type) => {
  setMessage(text)
  setMessageType(type)
}
const handleSendDiaryOtp = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/diary/pin-reset/send-otp',
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

    setDiaryOtpSent(true)
    showMessage('Diary PIN reset OTP sent to your email!', 'success')
  } catch (error) {
    console.error('Diary PIN OTP error:', error)
    showMessage('Something went wrong. Please try again.', 'error')
  }
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
const handleVerifyDiaryOtp = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/diary/pin-reset/verify-otp',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: diaryOtp }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      showMessage(data.message || 'Could not verify OTP', 'error')
      return
    }

    setDiaryOtpVerified(true)
    showMessage('Diary PIN OTP verified successfully!', 'success')
  } catch (error) {
    console.error('Diary OTP verification error:', error)
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
const handleUpdateDiaryPin = async () => {
  if (newDiaryPin.length !== 4) {
    showMessage('Diary PIN must be exactly 4 digits', 'error')
    return
  }

  if (newDiaryPin !== confirmDiaryPin) {
    showMessage('Diary PINs do not match', 'error')
    return
  }

  try {
    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5000/api/diary/pin-reset/update',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPin: newDiaryPin }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      showMessage(data.message || 'Could not reset Diary PIN', 'error')
      return
    }

    showMessage('Diary PIN reset successfully!', 'success')
    setTimeout(() => setMessage(''), 2500)

    setShowDiaryPinReset(false)
    setDiaryOtpSent(false)
    setDiaryOtp('')
    setDiaryOtpVerified(false)
    setNewDiaryPin('')
    setConfirmDiaryPin('')
  } catch (error) {
    console.error('Diary PIN update error:', error)
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
      {!showAccountPassword && !showDiaryPinReset ? (
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
                onClick={() => {
  setShowDiaryPinReset(true)
  setMessage('')
}}
              >
                Change Diary Password
              </button>
            </div>
          </div>
        </>
      ) : showDiaryPinReset ? (
  <div className="account-password-form">
  <h3>Reset Diary PIN</h3>
  <p>We'll send a verification code to your registered email:</p>

  <p className="security-email">
    {currentUser?.email || 'your email'}
  </p>

  {!diaryOtpSent && (
    <button
      className="setup-primary-button"
      onClick={handleSendDiaryOtp}
    >
      Send OTP
    </button>
  )}

  {diaryOtpSent && !diaryOtpVerified && (
  <div className="otp-verification">
    <label>Enter the 6-digit OTP</label>
    <input
      type="text"
      maxLength="6"
      value={diaryOtp}
      onChange={(e) =>
        setDiaryOtp(e.target.value.replace(/\D/g, ''))
      }
      placeholder="Enter OTP"
      inputMode="numeric"
    />
  </div>
)}

{diaryOtpSent && !diaryOtpVerified && (
  <button
    className="setup-primary-button"
    onClick={handleVerifyDiaryOtp}
    disabled={diaryOtp.length !== 6}
  >
    Verify OTP
  </button>
)}
{diaryOtpVerified && (
  <div className="new-password-fields">
    <label>New Diary PIN</label>
    <input
      type="password"
      maxLength="4"
      inputMode="numeric"
      value={newDiaryPin}
      onChange={(e) =>
        setNewDiaryPin(e.target.value.replace(/\D/g, ''))
      }
      placeholder="Enter new 4-digit PIN"
    />

    <label>Confirm New Diary PIN</label>
    <input
      type="password"
      maxLength="4"
      inputMode="numeric"
      value={confirmDiaryPin}
      onChange={(e) =>
        setConfirmDiaryPin(e.target.value.replace(/\D/g, ''))
      }
      placeholder="Confirm new 4-digit PIN"
    />
  </div>
)}
{diaryOtpVerified && (
  <button
    className="setup-primary-button"
    onClick={handleUpdateDiaryPin}
    disabled={
      newDiaryPin.length !== 4 ||
      confirmDiaryPin.length !== 4
    }
  >
    Update Diary PIN
  </button>
)}
</div>
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