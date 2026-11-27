const form = document.getElementById('register-form');
const messageBox = document.getElementById('message');
const submitButton = document.getElementById('submit-button');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage(messageBox);

  const fullName = form.elements.fullName.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirmPassword.value;

  if (password !== confirmPassword) {
    showMessage(messageBox, 'As senhas não conferem.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Cadastrando...';

  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: { fullName, email, password },
    });

    form.reset();
    showMessage(messageBox, result.message, 'success');
    submitButton.textContent = 'Cadastro concluído';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 5000);
  } catch (error) {
    showMessage(messageBox, errorToText(error));
    submitButton.disabled = false;
    submitButton.textContent = 'Cadastrar';
  }
});