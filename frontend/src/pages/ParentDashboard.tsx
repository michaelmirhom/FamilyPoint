import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardActions, Chip, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { listChildren, createChild, listTasks, createTask, listRewards, createReward, getPendingSubmissions, approveSubmission, rejectSubmission, getPendingRedemptions, approveRedemption, rejectRedemption, deleteChild, deleteTask, deleteReward, API_URL, listAnnouncements, createAnnouncement, deleteAnnouncement } from '../api';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import { IconButton } from '@mui/material';

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TASK_TEMPLATES = [
  { name: 'Read Bible (10m)', category: 'FAITH', points: 10, description: 'Read the Bible for 10 minutes.' },
  { name: 'Memorize Verse', category: 'FAITH', points: 20, description: 'Memorize a weekly verse.' },
  { name: 'Finish Homework', category: 'SCHOOL', points: 20, description: 'Complete all school homework.' },
  { name: 'Read Book (15m)', category: 'SCHOOL', points: 15, description: 'Read a book for 15 minutes.' },
  { name: 'Clean Room', category: 'HOME', points: 15, description: 'Tidy up your bedroom.' },
  { name: 'Empty Dishwasher', category: 'HOME', points: 10, description: 'Unload clean dishes.' },
  { name: 'Take out Trash', category: 'HOME', points: 10, description: 'Take trash bags to the bin.' },
  { name: 'Help Sibling', category: 'KINDNESS', points: 20, description: 'Help a brother or sister with something.' },
  { name: 'Write Thank You Note', category: 'KINDNESS', points: 25, description: 'Write a note of appreciation.' },
];

export default function ParentDashboard() {
  const [tab, setTab] = useState(0);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [openChildDialog, setOpenChildDialog] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openRewardDialog, setOpenRewardDialog] = useState(false);
  const [viewEvidence, setViewEvidence] = useState<string | null>(null);

  // Form states
  const [newChild, setNewChild] = useState({ name: '', username: '', password: '' });
  const [newTask, setNewTask] = useState({ name: '', category: 'FAITH', points: 10, description: '' });
  const [newReward, setNewReward] = useState({ name: '', type: 'PRIVILEGE', cost_points: 100, description: '' });
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const fetchData = async () => {
    try {
      if (tab === 0) { // Overview / Submissions
        const s = await getPendingSubmissions(); setPendingSubs(s.data);
        const r = await getPendingRedemptions(); setPendingRedemptions(r.data);
        const c = await listChildren(); setChildrenList(c.data);
      } else if (tab === 1) { // Children
        const c = await listChildren(); setChildrenList(c.data);
      } else if (tab === 2) { // Tasks
        const t = await listTasks(); setTasks(t.data);
      } else if (tab === 3) { // Rewards
        const r = await listRewards(); setRewards(r.data);
      } else if (tab === 4) { // Announcements
        const a = await listAnnouncements(); setAnnouncements(a.data);
        const c = await listChildren(); setChildrenList(c.data); // Need children to map names
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleCreateChild = async () => {
    try {
      await createChild(newChild);
      setOpenChildDialog(false);
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || 'Error creating child');
    }
  };
  const handleCreateTask = async () => {
    await createTask(newTask);
    setOpenTaskDialog(false);
    fetchData();
  };
  const handleCreateReward = async () => {
    await createReward(newReward);
    setOpenRewardDialog(false);
    fetchData();
  };
  const handleApproveSub = async (id: number) => { await approveSubmission(id); fetchData(); };
  const handleRejectSub = async (id: number) => { await rejectSubmission(id); fetchData(); };
  const handleApproveRedemption = async (id: number) => { await approveRedemption(id); fetchData(); };
  const handleRejectRedemption = async (id: number) => { await rejectRedemption(id); fetchData(); };

  const handleDeleteChild = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try { await deleteChild(id); fetchData(); } catch (e) { alert('Error deleting child'); }
    }
  };
  const handleDeleteTask = async (id: number) => {
    if (window.confirm("Delete this task?")) {
      try { await deleteTask(id); fetchData(); } catch (e) { alert('Error deleting task'); }
    }
  };
  const handleDeleteReward = async (id: number) => {
    if (window.confirm("Delete this reward?")) {
      try { await deleteReward(id); fetchData(); } catch (e) { alert('Error deleting reward'); }
    }
  };

  const getEvidenceUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Overview & Approvals" />
          <Tab label="Children" />
          <Tab label="Tasks Library" />
          <Tab label="Rewards" />
          <Tab label="Announcements" />
        </Tabs>
      </Box>

      {/* OVERVIEW */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          {/* Stats */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Children Status</Typography>
            <Grid container spacing={2}>
              {childrenList.map((c: any) => (
                <Grid item xs={12} sm={4} key={c.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{c.name}</Typography>
                      <Typography color="textSecondary">@{c.username}</Typography>
                      {/* Ideally we fetch points summary here too, but listing doesn't give it. We'd need to fetch indiv or enrich list.*/}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Pending Submissions */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Pending Tasks</Typography>
            {pendingSubs.length === 0 ? <Typography color="textSecondary">No pending submissions.</Typography> : (
              <List>
                {pendingSubs.map((s: any) => (
                  <Paper key={s.id} sx={{ mb: 2, p: 2 }} variant="outlined">
                    <Typography variant="subtitle2">Task ID: {s.task_id}</Typography>
                    {s.note && <Typography variant="body2">Note: {s.note}</Typography>}
                    {s.bible_reference && <Typography variant="body2" color="primary">Reference: {s.bible_reference}</Typography>}
                    {s.reflection && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Reflection: {s.reflection}</Typography>}

                    {(s.evidence && s.evidence.length > 0) ? (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', width: '100%' }}>Evidence:</Typography>
                        {s.evidence.map((ev: any, index: number) => (
                          <Button
                            key={ev.id}
                            variant="outlined"
                            size="small"
                            onClick={() => setViewEvidence(ev.file_path)}
                          >
                            View Item {index + 1}
                          </Button>
                        ))}
                      </Box>
                    ) : s.evidence_file_path && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setViewEvidence(s.evidence_file_path)}
                          sx={{ mt: 1 }}
                        >
                          View Evidence
                        </Button>
                      </Box>
                    )}

                    <Box sx={{ mt: 1 }}>
                      <Button size="small" startIcon={<CheckIcon />} onClick={() => handleApproveSub(s.id)}>Approve</Button>
                      <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => handleRejectSub(s.id)}>Reject</Button>
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Grid>

          {/* Pending Rewards */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Reward Requests</Typography>
            {pendingRedemptions.length === 0 ? <Typography color="textSecondary">No pending requests.</Typography> : (
              <List>
                {pendingRedemptions.map((r: any) => (
                  <Paper key={r.id} sx={{ mb: 2, p: 2 }} variant="outlined">
                    <Typography variant="subtitle2">Reward: {r.reward.name} ({r.cost_points_at_time} pts)</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" startIcon={<CheckIcon />} onClick={() => handleApproveRedemption(r.id)}>Approve</Button>
                      <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => handleRejectRedemption(r.id)}>Reject</Button>
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* CHILDREN */}
      <TabPanel value={tab} index={1}>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenChildDialog(true)} sx={{ mb: 2 }}>Add Child</Button>
        <Grid container spacing={2}>
          {childrenList.map((c: any) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{c.name}</Typography>
                  <Typography color="textSecondary">Username: {c.username}</Typography>
                  <Typography variant="body2">Role: Child</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteChild(c.id, c.name)}>Delete</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Dialog open={openChildDialog} onClose={() => setOpenChildDialog(false)}>
          <DialogTitle>Add New Child</DialogTitle>
          <DialogContent>
            <TextField label="Name" fullWidth margin="dense" value={newChild.name} onChange={e => setNewChild({ ...newChild, name: e.target.value })} />
            <TextField label="Username" fullWidth margin="dense" value={newChild.username} onChange={e => setNewChild({ ...newChild, username: e.target.value })} />
            <TextField label="Password" type="password" fullWidth margin="dense" value={newChild.password} onChange={e => setNewChild({ ...newChild, password: e.target.value })} />
            <Button onClick={handleCreateChild} variant="contained" fullWidth sx={{ mt: 2 }}>Create Child</Button>
          </DialogContent>
        </Dialog>
      </TabPanel>

      {/* TASKS */}
      <TabPanel value={tab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Quick Add from Templates:</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {TASK_TEMPLATES.map((t, i) => (
              <Chip
                key={i}
                label={`${t.name} (${t.points})`}
                onClick={() => handleUseTemplate(t)}
                icon={<AddIcon />}
                variant="outlined"
                clickable
              />
            ))}
          </Box>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenTaskDialog(true)} sx={{ mb: 2 }}>Create Custom Task</Button>
        <Grid container spacing={2}>
          {tasks.map((t: any) => (
            <Grid item xs={12} sm={6} key={t.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{t.name}</Typography>
                    <Chip label={`${t.points} pts`} color="secondary" size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{t.category}</Typography>
                  <Typography variant="body2">{t.description}</Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" color="error" onClick={() => handleDeleteTask(t.id)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            <TextField label="Name" fullWidth margin="dense" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} />
            <TextField label="Description" fullWidth margin="dense" multiline rows={2} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
            <TextField label="Points" type="number" fullWidth margin="dense" value={newTask.points} onChange={e => setNewTask({ ...newTask, points: parseInt(e.target.value) })} />
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select value={newTask.category} label="Category" onChange={(e: any) => setNewTask({ ...newTask, category: e.target.value })}>
                {['FAITH', 'SCHOOL', 'HOME', 'KINDNESS', 'OTHER'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={handleCreateTask} variant="contained" fullWidth sx={{ mt: 2 }}>Create Task</Button>
          </DialogContent>
        </Dialog>
      </TabPanel>

      {/* REWARDS */}
      <TabPanel value={tab} index={3}>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenRewardDialog(true)} sx={{ mb: 2 }}>Create Reward</Button>
        <Grid container spacing={2}>
          {rewards.map((r: any) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{r.name}</Typography>
                    <Chip label={`${r.cost_points} pts`} color="success" size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">{r.type}</Typography>
                  <Typography variant="body2">{r.description}</Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" color="error" onClick={() => handleDeleteReward(r.id)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Dialog open={openRewardDialog} onClose={() => setOpenRewardDialog(false)}>
          <DialogTitle>Create Reward</DialogTitle>
          <DialogContent>
            <TextField label="Name" fullWidth margin="dense" value={newReward.name} onChange={e => setNewReward({ ...newReward, name: e.target.value })} />
            <TextField label="Description" fullWidth margin="dense" multiline value={newReward.description} onChange={e => setNewReward({ ...newReward, description: e.target.value })} />
            <TextField label="Cost (Points)" type="number" fullWidth margin="dense" value={newReward.cost_points} onChange={e => setNewReward({ ...newReward, cost_points: parseInt(e.target.value) })} />
            <FormControl fullWidth margin="dense">
              <InputLabel>Type</InputLabel>
              <Select value={newReward.type} label="Type" onChange={(e: any) => setNewReward({ ...newReward, type: e.target.value })}>
                {['MONEY', 'PRIVILEGE', 'GIFT'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={handleCreateReward} variant="contained" fullWidth sx={{ mt: 2 }}>Create Reward</Button>
          </DialogContent>
        </Dialog>
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Announcements</Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Send New Announcement</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write something to your children..."
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<CampaignIcon />}
                onClick={async () => {
                  if (!newAnnouncement.trim()) return;
                  await createAnnouncement({ message: newAnnouncement });
                  setNewAnnouncement('');
                  fetchData();
                }}
              >
                Send
              </Button>
            </Box>
          </Paper>

          <List>
            {announcements.map((a: any) => (
              <Paper key={a.id} sx={{ mb: 2 }} variant="outlined">
                <ListItem>
                  <ListItemText
                    primary={a.message}
                    secondary={new Date(a.created_at).toLocaleString()}
                  />
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={async () => {
                      if (window.confirm('Delete this announcement?')) {
                        await deleteAnnouncement(a.id);
                        fetchData();
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                {a.reads && a.reads.length > 0 && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="caption" color="textSecondary">Seen by:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {a.reads.map((r: any) => {
                        const child = childrenList.find((c: any) => c.id === r.child_id);
                        return (
                          <Chip
                            key={r.child_id}
                            label={`${child ? child.name : 'Unknown'} (${new Date(r.read_at).toLocaleTimeString()})`}
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<CheckIcon />}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}
                {(!a.reads || a.reads.length === 0) && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="caption" color="textSecondary">Not seen yet</Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </List>
        </Box>
      </TabPanel>
      <Dialog open={!!viewEvidence} onClose={() => setViewEvidence(null)} maxWidth="md" fullWidth>
        <DialogTitle>View Evidence</DialogTitle>
        <DialogContent>
          {viewEvidence && (
            viewEvidence.toLowerCase().endsWith('.pdf') ? (
              <Box sx={{ width: '100%', height: '500px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2">Previewing PDF:</Typography>
                <iframe src={getEvidenceUrl(viewEvidence)} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Evidence" />
                <Button variant="contained" href={getEvidenceUrl(viewEvidence)} target="_blank" rel="noopener noreferrer">Download PDF</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={getEvidenceUrl(viewEvidence)}
                  alt="Evidence Full"
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              </Box>
            )
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setViewEvidence(null)}>Close</Button>
        </Box>
      </Dialog>
    </Box>
  );
}
