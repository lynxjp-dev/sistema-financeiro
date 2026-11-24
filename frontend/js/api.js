class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || [];
  }
}

async function apiFetch(path, options = {}, canRetry = true) {
  const config = {
    method: 'GET',
    credentials: 'include', 
    ...options,
    headers: { ...(options.headers || {}) },
  };

  if (config.body && typeof config.body !== 'string') {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, config);
  } catch (error) {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  const isAuthRoute = path === '/auth/login' || path === '/auth/refresh';
  if (response.status === 401 && canRetry && !isAuthRoute) {
    try {
      const refreshed = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshed.ok) {
        return apiFetch(path, options, false);
      }
    } catch (error) {
      
    }
  }

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
   
  }

  if (!response.ok) {
    throw new ApiError((data && data.error) || 'Erro inesperado.', response.status, data && data.details);
  }
  return data;
}

function showMessage(element, text, type = 'error') {
  element.textContent = text; 
  element.className = `message ${type}`;
  element.hidden = false;
}

function hideMessage(element) {
  element.textContent = '';
  element.hidden = true;
}
ó
function errorToText(error) {
  if (error.details && error.details.length > 0) {
    return error.details.map((item) => item.mensagem).join(' • ');
  }
  return error.message;
}