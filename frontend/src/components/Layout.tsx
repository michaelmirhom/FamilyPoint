import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Layout() {
    const { user, logoutFn } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutFn();
        navigate('/');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="static" sx={{ bgcolor: 'primary.main', boxShadow: 3 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(user ? (user.role === 'PARENT' ? '/parent' : '/child') : '/')}>
                        FamilyPoints
                    </Typography>

                    {user ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    Welcome, {user.name}
                                </Typography>
                                <Tooltip title="Logout">
                                    <IconButton color="inherit" onClick={handleLogout}>
                                        <LogoutIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" onClick={() => navigate('/')}>Login</Button>
                            <Button color="inherit" onClick={() => navigate('/register')}>Register Parent</Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <Outlet />
            </Container>

            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'primary.main', textAlign: 'center' }}>
                <Container maxWidth="sm">
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FFD700', letterSpacing: 0.5 }}>
                        Created by Michael Mirhom
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFD700', mt: 0.5 }}>
                        Software Engineer at JPMorgan
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
