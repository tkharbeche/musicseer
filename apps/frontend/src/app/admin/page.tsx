'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    Server,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    Shield,
    Key,
    User as UserIcon,
    FileText,
    Check,
    Send,
    RefreshCcw
} from 'lucide-react';

export default function AdminPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'instances' | 'users' | 'requests'>('instances');

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<'navidrome' | 'lidarr'>('navidrome');
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [username, setUsername] = useState('');
    const [isAuthSource, setIsAuthSource] = useState(false);
    const [rootFolderPath, setRootFolderPath] = useState('/music');

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!storedToken || user.role !== 'admin') {
            router.push('/');
        } else {
            setToken(storedToken);
        }
    }, [router]);

    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        headers: { Authorization: `Bearer ${token}` }
    });

    const { data: instances, isLoading } = useQuery('instances', async () => {
        const res = await api.get('/instances');
        return res.data;
    }, { enabled: !!token && activeTab === 'instances' });

    const { data: users, isLoading: loadingUsers } = useQuery('users', async () => {
        const res = await api.get('/auth/users');
        return res.data;
    }, { enabled: !!token && activeTab === 'users' });

    const { data: requests, isLoading: loadingRequests } = useQuery('requests', async () => {
        const res = await api.get('/requests');
        return res.data;
    }, { enabled: !!token && activeTab === 'requests' });

    const createMutation = useMutation(async (data: any) => {
        return api.post('/instances', data);
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('instances');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to create instance');
        }
    });

    const deleteMutation = useMutation(async (id: string) => {
        return api.delete(`/instances/${id}`);
    }, {
        onSuccess: () => queryClient.invalidateQueries('instances')
    });

    const updateStatusMutation = useMutation(async ({ id, status }: { id: string, status: string }) => {
        return api.put(`/requests/${id}/status`, { status });
    }, {
        onSuccess: () => queryClient.invalidateQueries('requests')
    });

    const submitMutation = useMutation(async (id: string) => {
        return api.post(`/requests/${id}/submit`);
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('requests');
            alert('Submitted to Lidarr successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to submit to Lidarr. Make sure a target Lidarr server is configured.');
        }
    });

    const syncMutation = useMutation(async () => {
        return api.post('/discovery/sync-now');
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries('trending');
            alert('Global discovery sync triggered successfully! Images will update shortly.');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to trigger sync');
        }
    });

    const resetForm = () => {
        setName('');
        setType('navidrome');
        setBaseUrl('');
        setApiKey('');
        setUsername('');
        setIsAuthSource(false);
        setRootFolderPath('/music');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const settings = type === 'lidarr' ? { rootFolderPath } : undefined;
        createMutation.mutate({
            name,
            type,
            baseUrl,
            apiKey,
            username: type === 'navidrome' ? username : undefined,
            isAuthSource: type === 'navidrome' ? isAuthSource : false,
            settings
        });
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-[#00050d] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-muted-foreground">Manage your server instances and infrastructure</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 p-1 rounded-2xl flex">
                            <button
                                onClick={() => setActiveTab('instances')}
                                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'instances' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                            >
                                Instances
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                            >
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'requests' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'}`}
                            >
                                Requests
                            </button>
                        </div>
                        {activeTab === 'instances' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} />
                                Add Instance
                            </button>
                        )}
                        <button
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isLoading}
                            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all border border-white/10"
                        >
                            {syncMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                            Sync Discovery
                        </button>
                    </div>
                </header>

                {activeTab === 'instances' ? (
                    isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instances?.map((instance: any) => (
                                <div key={instance.id} className="glass p-6 rounded-3xl relative group overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${instance.type === 'navidrome' ? 'bg-purple-500' : 'bg-blue-500'}`} />

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Server size={24} className={instance.type === 'navidrome' ? 'text-purple-400' : 'text-blue-400'} />
                                        </div>
                                        <div className="flex gap-2">
                                            {instance.isAuthSource && (
                                                <div className="bg-primary/20 text-primary p-2 rounded-lg" title="Authentication Source">
                                                    <Shield size={16} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => deleteMutation.mutate(instance.id)}
                                                className="text-muted-foreground hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">{instance.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-semibold">{instance.type}</p>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-black/20 p-2 rounded-lg">
                                            <span className="truncate flex-1">{instance.baseUrl}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <span>Status: {instance.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'requests' ? (
                    loadingRequests ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                    ) : (
                        <div className="glass overflow-hidden rounded-3xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5 text-muted-foreground text-sm uppercase font-semibold">
                                    <tr>
                                        <th className="p-4">Artist / Album</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {requests?.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-4">
                                                <div className="font-bold">{r.artistName}</div>
                                                {r.albumName && <div className="text-xs text-muted-foreground">{r.albumName}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {r.user?.username || 'Unknown'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                    r.status === 'approved' ? 'bg-blue-500/20 text-blue-500' :
                                                        r.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-yellow-500/20 text-yellow-500'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {r.status === 'pending' && (
                                                        <button
                                                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'approved' })}
                                                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-all"
                                                            title="Approve"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    {r.status === 'approved' && (
                                                        <button
                                                            onClick={() => submitMutation.mutate(r.id)}
                                                            className="bg-green-600 hover:bg-green-500 p-2 rounded-lg transition-all flex items-center gap-2 px-3"
                                                            title="Submit to Lidarr"
                                                        >
                                                            <Send size={16} />
                                                            <span className="text-xs font-bold">Submit</span>
                                                        </button>
                                                    )}
                                                    {r.status === 'pending' && (
                                                        <button
                                                            onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'denied' })}
                                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition-all"
                                                            title="Deny"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {requests?.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-10 text-center text-muted-foreground">
                                                No requests found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    loadingUsers ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                    ) : (
                        <div className="glass overflow-hidden rounded-3xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5 text-muted-foreground text-sm uppercase font-semibold">
                                    <tr>
                                        <th className="p-4">Username</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Auto-Approve</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users?.map((u: any) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-4 font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs">
                                                        <UserIcon size={14} />
                                                    </div>
                                                    {u.username}
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {u.canAutoApprove ? (
                                                    <CheckCircle2 className="text-green-500" size={20} />
                                                ) : (
                                                    <XCircle className="text-muted-foreground" size={20} />
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-muted-foreground hover:text-white transition-all p-2">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-lg p-8 rounded-3xl animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold mb-6">Add New Instance</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Instance Name</label>
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="My Navidrome" required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Type</label>
                                <select
                                    value={type} onChange={e => setType(e.target.value as any)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
                                >
                                    <option value="navidrome" className="bg-[#00050d]">Navidrome (Subsonic)</option>
                                    <option value="lidarr" className="bg-[#00050d]">Lidarr</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Base URL</label>
                                <input
                                    value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="http://192.168.1.10:4533" required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    {type === 'navidrome' ? 'Password / Token' : 'API Key'}
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="password"
                                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="••••••••" required
                                    />
                                </div>
                            </div>

                            {type === 'navidrome' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Admin Username</label>
                                        <input
                                            value={username} onChange={e => setUsername(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="admin" required
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                        <input
                                            type="checkbox"
                                            checked={isAuthSource}
                                            onChange={e => setIsAuthSource(e.target.checked)}
                                            className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary focus:ring-primary/50"
                                        />
                                        <div>
                                            <p className="text-sm font-bold">Use as Auth Source</p>
                                            <p className="text-xs text-muted-foreground">Allow users to login via this Navidrome instance</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {type === 'lidarr' && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Root Folder Path</label>
                                    <input
                                        value={rootFolderPath} onChange={e => setRootFolderPath(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="/data/music/" required
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">The path inside Lidarr where music is stored (e.g., /data/music/)</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button" onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={createMutation.isLoading}
                                    className="flex-1 bg-primary hover:bg-primary/90 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {createMutation.isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save Instance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
