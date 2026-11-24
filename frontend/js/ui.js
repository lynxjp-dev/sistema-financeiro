document.querySelectorAll('.toggle-password').forEach((button) => {
  button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    const showing = input.type === 'text';

    input.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Mostrar' : 'Ocultar';
    button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  });
});