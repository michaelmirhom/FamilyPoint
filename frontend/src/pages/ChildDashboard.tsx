import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, TextField, Chip, LinearProgress, Alert, Badge } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getChildSummary, listTasks, submitTask, listRewards, redeemReward, getMySubmissions } from '../api';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ChildDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  
  const [openSubmit, setOpenSubmit] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({ note: '', bible_reference: '', reflection: '' });
  
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
        } catch(e) { console.error(e); }
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleOpenSubmit = (task: any) => {
    setSelectedTask(task);
    setSubmissionData({ note: '', bible_reference: '', reflection: '' });
    setOpenSubmit(true);
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    await submitTask({
        task_id: selectedTask.id,
        ...submissionData
    });
    setOpenSubmit(false);
    fetchData(); // Refresh to show pending in history? Or just points (wont change yet)
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
  
  const progressCheck = level < 5 ? ((points - (level===1?0: (level===2?200: (level===3?400:700)))) / (nextLevelPoints - (level===1?0: (level===2?200: (level===3?400:700)))) * 100) : 100;

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
                    onChange={e => setSubmissionData({...submissionData, note: e.target.value})} 
                />
                {selectedTask?.category === 'FAITH' && (
                    <>
                        <TextField 
                            label="Bible Reference" 
                            fullWidth 
                            margin="dense" 
                            placeholder="e.g. John 3:16"
                            value={submissionData.bible_reference} 
                            onChange={e => setSubmissionData({...submissionData, bible_reference: e.target.value})} 
                        />
                        <TextField 
                            label="Reflection / What I learned" 
                            fullWidth 
                            multiline 
                            rows={2} 
                            margin="dense" 
                            value={submissionData.reflection} 
                            onChange={e => setSubmissionData({...submissionData, reflection: e.target.value})} 
                        />
                    </>
                )}
                <Button onClick={handleSubmitTask} variant="contained" fullWidth sx={{ mt: 2 }}>Submit for Approval</Button>
            </DialogContent>
       </Dialog>
    </Box>
  );
}
