const userGreeting = document.getElementById('user-greeting');
const userNameTop = document.getElementById('user-name-top');
const userAvatar = document.getElementById('user-avatar');
const userEmail = document.getElementById('user-email');
const userRole = document.getElementById('user-role');
const messageBox = document.getElementById('message');
const logoutButton = document.getElementById('logout-button');


function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

async function loadUser() {
  try {
    const { user } = await apiFetch('/auth/me');

    const displayName = user.fullName || user.email.split('@')[0];
    const firstName = displayName.split(' ')[0];

    userGreeting.textContent = `Olá, ${firstName}!`;
    userNameTop.textContent = displayName;
    userAvatar.textContent = getInitials(displayName);
    userEmail.textContent = user.email;
    userRole.textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';
  } catch (error) {
    
    if (error.status === 401 || error.status === 403) {
      window.location.href = 'index.html';
      return;
    }
    showMessage(messageBox, errorToText(error));
  }
}

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (error) {
    
  }
  window.location.href = 'index.html';
});

loadUser();