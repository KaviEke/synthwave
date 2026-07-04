export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
      ? `http://${window.location.hostname}:5000/api`
      : '/api');

export const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
      ? `http://${window.location.hostname}:5000`
      : window.location.origin);
