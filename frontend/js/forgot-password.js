const form = document.getElementById('forgot-form');
const messageBox = document.getElementById('message');
const submitButton = document.getElementById('submit-button');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage(messageBox);

  submitButton.disabled = true;
  submitButton.textContent = 'Enviando...';

  try {
    const result = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email: form.elements.email.value.trim() },
    });

    showMessage(messageBox, result.message, 'success');
    submitButton.textContent = 'Pedido enviado';
  } catch (error) {
    showMessage(messageBox, errorToText(error));
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar link';
  }
});