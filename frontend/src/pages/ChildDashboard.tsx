import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, TextField, Chip, LinearProgress, Alert, Badge, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getChildSummary, listTasks, submitTask, listRewards, redeemReward, getMySubmissions, uploadFile } from '../api';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function ChildDashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [mySubs, setMySubs] = useState<any[]>([]);

    const [openSubmit, setOpenSubmit] = useState(false);

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [submissionData, setSubmissionData] = useState({ note: '', bible_reference: '', reflection: '' });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [openAttachOptions, setOpenAttachOptions] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [uploading, setUploading] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const fetchData = async () => {
        if (user) {
            try {
                const sum = await getChildSummary(user.id);
                setSummary(sum.data);
                const t = await listTasks();
                setTasks(t.data.filter((x: any) => x.is_active));
                const r = await listRewards();
                setRewards(r.data.filter((x: any) => x.is_active));
                const s = await getMySubmissions();
                setMySubs(s.data);
            } catch (e) { console.error(e); }
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    const handleOpenSubmit = (task: any) => {
        setSelectedTask(task);
        setSubmissionData({ note: '', bible_reference: '', reflection: '' });
        setSelectedFiles([]);
        setOpenSubmit(true);
    };

    const startCamera = async () => {
        setOpenAttachOptions(false);
        setOpenCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
            setOpenCamera(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setOpenCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `captured-${Date.now()}.jpg`, { type: "image/jpeg" });
                        setSelectedFiles(prev => [...prev, file]);
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    };

    const handleSubmitTask = async () => {
        if (!selectedTask) return;

        let evidencePaths: string[] = [];
        if (selectedFiles.length > 0) {
            setUploading(true);
            try {
                // Upload all files in parallel
                const uploadPromises = selectedFiles.map(file => uploadFile(file));
                const responses = await Promise.all(uploadPromises);
                evidencePaths = responses.map(res => res.data.url);
            } catch (error) {
                console.error("Upload failed", error);
                alert("File upload failed. Please try again.");
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        await submitTask({
            task_id: selectedTask.id,
            ...submissionData,
            evidence_files: evidencePaths,
            evidence_file_path: evidencePaths.length > 0 ? evidencePaths[0] : null // Fallback
        });
        setOpenSubmit(false);
        fetchData();
    };

    const handleRedeem = async (reward: any) => {
        if (!summary || summary.points.totalPoints < reward.cost_points) {
            alert("Not enough points!");
            return;
        }
        if (confirm(`Redeem ${reward.name} for ${reward.cost_points} points?`)) {
            await redeemReward(reward.id);
            fetchData(); // Pending redemption won't deduct points yet usually until approved, but let's refresh
        }
    };

    if (!summary) return <LinearProgress />;

    // Calculate Level (Simple logic matching backend usually, but backend logic isn't exposed directly as "Level X", we have to infer or fetch. 
    // Requirement said "Computes level from total points". 
    // Let's implement a quick helper consistent with requirements: 
    // L1: 0-199, L2: 200-399, L3: 400-699, L4: 700-999, L5: 1000+
    const points = summary.points.totalPoints;
    let level = 1;
    let nextLevelPoints = 200;
    if (points >= 1000) { level = 5; nextLevelPoints = 2000; }
    else if (points >= 700) { level = 4; nextLevelPoints = 1000; }
    else if (points >= 400) { level = 3; nextLevelPoints = 700; }
    else if (points >= 200) { level = 2; nextLevelPoints = 400; }

    const progressCheck = level < 5 ? ((points - (level === 1 ? 0 : (level === 2 ? 200 : (level === 3 ? 400 : 700)))) / (nextLevelPoints - (level === 1 ? 0 : (level === 2 ? 200 : (level === 3 ? 400 : 700)))) * 100) : 100;

    return (
        <Box sx={{ pb: 5 }}>
            {/* HEADER STATS */}
            <Paper sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd' }}>
                <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{points} PTS</Typography>
                        {summary.points.totalMoneyEquivalent > 0 &&
                            <Typography variant="subtitle1" color="success.main">${summary.points.totalMoneyEquivalent.toFixed(2)} Value</Typography>
                        }
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">Level {level}</Typography>
                        <Box sx={{ width: '100%', mr: 1, mt: 1 }}>
                            <LinearProgress variant="determinate" value={progressCheck} sx={{ height: 10, borderRadius: 5 }} />
                        </Box>
                        <Typography variant="caption">{points} / {nextLevelPoints} to next level</Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        {/* Streaks (Mocked or from summary if we added it. We commented it out in schema but let's pretend or fix) 
                    The Requirements said "Streaks may be computed dynamically".
                    We didn't add streaks to schema full summary yet properly.
                    Let's just show Badges count for now.
                */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Chip icon={<EmojiEventsIcon />} label={`${summary.badges.length} Badges`} color="warning" />
                            {/* <Chip icon={<LocalFireDepartmentIcon />} label="3 Day Streak" color="error" /> */}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={4}>
                {/* TASKS */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Available Tasks</Typography>
                    <Grid container spacing={2}>
                        {tasks.map((t: any) => (
                            <Grid item xs={12} sm={6} key={t.id}>
                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="h6">{t.name}</Typography>
                                            <Chip label={`+${t.points}`} color="primary" size="small" />
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>{t.category}</Typography>
                                        <Typography variant="body2">{t.description}</Typography>
                                    </CardContent>
                                    <Box sx={{ p: 2, pt: 0 }}>
                                        <Button fullWidth variant="contained" onClick={() => handleOpenSubmit(t)}>Complete</Button>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* SIDEBAR: REWARDS & BADGES */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Rewards Store</Typography>
                    {rewards.map((r: any) => (
                        <Card key={r.id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1">{r.name}</Typography>
                                    <Typography variant="subtitle1" color="success.main">{r.cost_points} pts</Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    disabled={points < r.cost_points}
                                    onClick={() => handleRedeem(r)}
                                >
                                    Redeem
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 'bold' }}>My Badges</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {summary.badges.map((b: any) => (
                            <Chip key={b.id} icon={<StarIcon />} label={b.badge.name} color="secondary" />
                        ))}
                        {summary.badges.length === 0 && <Typography variant="body2" color="textSecondary">No badges yet. Keep working!</Typography>}
                    </Box>
                </Grid>
            </Grid>

            {/* SUBMIT DIALOG */}
            <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)}>
                <DialogTitle>Complete Task: {selectedTask?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Add a note (optional)"
                        fullWidth
                        multiline
                        rows={2}
                        margin="dense"
                        value={submissionData.note}
                        onChange={e => setSubmissionData({ ...submissionData, note: e.target.value })}
                    />
                    {selectedTask?.category === 'FAITH' && (
                        <>
                            <TextField
                                label="Bible Reference"
                                fullWidth
                                margin="dense"
                                placeholder="e.g. John 3:16"
                                value={submissionData.bible_reference}
                                onChange={e => setSubmissionData({ ...submissionData, bible_reference: e.target.value })}
                            />
                            <TextField
                                label="Reflection / What I learned"
                                fullWidth
                                multiline
                                rows={2}
                                margin="dense"
                                value={submissionData.reflection}
                                onChange={e => setSubmissionData({ ...submissionData, reflection: e.target.value })}
                            />
                        </>
                    )}

                    <Box
                        sx={{ mt: 2, mb: 1, border: '2px dashed #e0e0e0', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#fafafa', cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bdbdbd' } }}
                        onClick={() => setOpenAttachOptions(true)}
                    >
                        {selectedFiles.length > 0 ? (
                            <Box>
                                <AttachFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>{selectedFiles.length} File(s) Selected</Typography>
                                {selectedFiles.map((f, i) => (
                                    <Typography key={i} variant="caption" display="block">{f.name}</Typography>
                                ))}
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>Tap to add more</Typography>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
                                    <CameraAltIcon sx={{ color: '#9e9e9e' }} />
                                    <PhotoLibraryIcon sx={{ color: '#9e9e9e' }} />
                                </Box>
                                <Typography variant="subtitle1" color="textPrimary" sx={{ fontWeight: '500' }}>Attach Evidence</Typography>
                                <Typography variant="caption" color="textSecondary">Upload photo or capture from camera</Typography>
                            </>
                        )}
                    </Box>

                    {/* Hidden Inputs */}
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) setSelectedFiles(prev => [...prev, e.target.files![0]]);
                        }}
                    />

                    <Button onClick={handleSubmitTask} variant="contained" fullWidth sx={{ mt: 2, py: 1.5, fontSize: '1rem' }} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Submit for Approval'}
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Attachment Options Dialog */}
            <Dialog open={openAttachOptions} onClose={() => setOpenAttachOptions(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add Evidence</DialogTitle>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={startCamera}>
                            <ListItemIcon><CameraAltIcon color="primary" /></ListItemIcon>
                            <ListItemText primary="Take Photo" secondary="Use Camera" />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => { fileInputRef.current?.click(); setOpenAttachOptions(false); }}>
                            <ListItemIcon><PhotoLibraryIcon color="secondary" /></ListItemIcon>
                            <ListItemText primary="Upload File" secondary="Select from Gallery" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Dialog>

            {/* Custom Camera Dialog */}
            <Dialog open={openCamera} onClose={stopCamera} fullWidth maxWidth="sm">
                <DialogTitle>Take Photo</DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', width: '100%', height: '300px', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={capturePhoto}
                        startIcon={<CameraAltIcon />}
                        sx={{ mt: 2, height: 50, borderRadius: 25 }}
                    >
                        Capture
                    </Button>
                </DialogContent>
            </Dialog>
        </Box >
    );
}
