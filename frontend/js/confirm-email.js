const confirmButton = document.getElementById('confirm-button');
const messageBox = document.getElementById('message');

const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
window.history.replaceState(null, '', window.location.pathname);

if (!tokenHash) {
  confirmButton.hidden = true;
  showMessage(messageBox, 'Link inválido ou incompleto. Use o link que enviamos por e-mail.');
}

confirmButton.addEventListener('click', async () => {
  hideMessage(messageBox);
  confirmButton.disabled = true;
  confirmButton.textContent = 'Confirmando...';

  try {
    const result = await apiFetch('/auth/confirm-email', {
      method: 'POST',
      body: { tokenHash },
    });

    confirmButton.hidden = true;
    showMessage(messageBox, result.message, 'success');
  } catch (error) {
    showMessage(messageBox, errorToText(error));
    confirmButton.disabled = false;
    confirmButton.textContent = 'Confirmar e-mail';
  }
});