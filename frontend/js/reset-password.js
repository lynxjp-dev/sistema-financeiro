const form = document.getElementById('reset-form');
const messageBox = document.getElementById('message');
const submitButton = document.getElementById('submit-button');

const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
window.history.replaceState(null, '', window.location.pathname);

if (!tokenHash) {
  form.hidden = true;
  showMessage(messageBox, 'Link inválido ou incompleto. Peça um novo link de recuperação.');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage(messageBox);

  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirmPassword.value;

  if (password !== confirmPassword) {
    showMessage(messageBox, 'As senhas não conferem.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';

  try {
    const result = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: { tokenHash, password },
    });

    form.hidden = true;
    showMessage(messageBox, `${result.message} Redirecionando para o login...`, 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  } catch (error) {
    showMessage(messageBox, errorToText(error));
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar nova senha';
  }
});