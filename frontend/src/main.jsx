import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import './index.css';

// Read values from Vite environment configuration
const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-mindfuels.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'dummy-client-id';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.mindfuels.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
