const form = document.getElementById('login-form');
const messageBox = document.getElementById('message');
const submitButton = document.getElementById('submit-button');

(async () => {
  try {
    await apiFetch('/auth/me');
    window.location.href = 'dashboard.html';
  } catch (error) {
    
  }
})();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage(messageBox);

  submitButton.disabled = true;
  submitButton.textContent = 'Entrando...';

  try {
    await apiFetch('/auth/login', {
      method: 'POST',
      body: {
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
      },
    });
    window.location.href = 'dashboard.html';
  } catch (error) {
    showMessage(messageBox, errorToText(error));
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
  }
});