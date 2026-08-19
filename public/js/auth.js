// public/js/auth.js
// -----------------------------------------------------------------------
// Handles Login, Register, Forgot Password, Reset Password and Change
// Password forms across the site (progressive enhancement — forms work
// via fetch to the JSON API, no full page reload needed).
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // ---- Login ----
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Signing in...';
      try {
        const data = await sfFetch('/api/auth/login', {
          method: 'POST',
          body: { email: loginForm.email.value, password: loginForm.password.value },
        });
        sfToast(data.message);
        // Read redirect from URL query param first, then from data-attribute
        const redirect = new URLSearchParams(window.location.search).get('redirect') || loginForm.dataset.redirect || '/';
        setTimeout(() => { window.location.href = redirect; }, 500);
      } catch (err) {
        sfToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  }

  // ---- Register ----
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (registerForm.password.value !== registerForm.confirmPassword.value) {
        sfToast('Passwords do not match', 'error');
        return;
      }
      const btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = 'Creating account...';
      try {
        const data = await sfFetch('/api/auth/register', {
          method: 'POST',
          body: {
            name: registerForm.name.value,
            email: registerForm.email.value,
            password: registerForm.password.value,
            phone: registerForm.phone.value,
          },
        });
        sfToast(data.message);
        setTimeout(() => { window.location.href = '/'; }, 600);
      } catch (err) {
        sfToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }

  // ---- Forgot Password ----
  const forgotForm = document.getElementById('forgotPasswordForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await sfFetch('/api/auth/forgot-password', { method: 'POST', body: { email: forgotForm.email.value } });
        sfToast(data.message);
        forgotForm.reset();
      } catch (err) {
        sfToast(err.message, 'error');
      }
    });
  }

  // ---- Reset Password ----
  const resetForm = document.getElementById('resetPasswordForm');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (resetForm.password.value !== resetForm.confirmPassword.value) {
        sfToast('Passwords do not match', 'error');
        return;
      }
      // Read token from URL (/reset-password/:token) as fallback when data-token is empty
      const token = resetForm.dataset.token || window.location.pathname.split('/reset-password/')[1] || '';
      try {
        const data = await sfFetch(`/api/auth/reset-password/${token}`, {
          method: 'PUT',
          body: { password: resetForm.password.value },
        });
        sfToast(data.message);
        setTimeout(() => { window.location.href = '/'; }, 600);
      } catch (err) {
        sfToast(err.message, 'error');
      }
    });
  }

  // ---- Change Password (profile page) ----
  const changePwForm = document.getElementById('changePasswordForm');
  if (changePwForm) {
    changePwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (changePwForm.newPassword.value !== changePwForm.confirmPassword.value) {
        sfToast('New passwords do not match', 'error');
        return;
      }
      try {
        const data = await sfFetch('/api/auth/change-password', {
          method: 'PUT',
          body: { currentPassword: changePwForm.currentPassword.value, newPassword: changePwForm.newPassword.value },
        });
        sfToast(data.message);
        changePwForm.reset();
      } catch (err) {
        sfToast(err.message, 'error');
      }
    });
  }
});
