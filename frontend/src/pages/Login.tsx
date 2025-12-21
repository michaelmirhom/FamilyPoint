import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Tab, Tabs } from '@mui/material';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginFn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await login(formData);
      loginFn(res.data.access_token);

      // Determine redirection based on role (fetched in AuthContext, but we might not have it strictly immediately if we rely on effect)
      // Actually AuthContext fetches individual user info via getMe() after setToken.
      // We can force a fetch or wait. But `login` returns user info implicitly if we wanted, 
      // but standard OAuth2 endpoint just returns token. 
      // We will let AuthContext effect redirect or we can just push to '/' and let Layout/App handle routing.
      // But typically we want to push to correct dash.
      // Let's rely on the user info we can decode or just wait for AuthContext?
      // For speed, let's just reload or let AuthContext handle state.
      // Better: redirect to /check-auth or just wait.
      // The useEffect below will detect the user change and redirect accordingly.

    } catch (err: any) {
      setError('Invalid credentials');
    }
  };

  // We need to wait for user to be populated essentially.
  // In App.tsx or a "RequireAuth" wrapper we usually handle this.
  // For now let's just use the `user` from context to redirect if present.
  const { user } = useAuth();
  React.useEffect(() => {
    if (user) {
      if (user.role === 'PARENT') navigate('/parent');
      else navigate('/child');
    }
  }, [user, navigate]);

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          Sign in to FamilyPoints
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email or Username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/register')}
          >
            New Parent? Register Here
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
