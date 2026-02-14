'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/api';
import { ServerInstance, Request as MusicRequest } from '@musicseer/shared-types';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'servers' | 'requests'>('requests');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8">
                <button
                    className={`py-4 px-6 font-medium text-sm ${activeTab === 'requests' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Music Requests
                </button>
                <button
                    className={`py-4 px-6 font-medium text-sm ${activeTab === 'servers' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('servers')}
                >
                    Server Instances
                </button>
            </div>

            {activeTab === 'requests' ? <RequestsManager /> : <ServersManager />}
        </div>
    );
}

function RequestsManager() {
    const queryClient = useQueryClient();
    const [selectedServers, setSelectedServers] = useState<Record<string, string>>({});

    const { data: requests, isLoading } = useQuery<MusicRequest[]>(
        'admin-requests',
        async () => {
            const res = await api.get('/requests');
            return res.data;
        }
    );

    const { data: servers } = useQuery<ServerInstance[]>(
        'admin-servers',
        async () => {
            const res = await api.get('/instances');
            return res.data;
        }
    );

    const lidarrServers = servers?.filter(s => s.type === 'lidarr' && s.isActive) || [];

    const updateStatusMutation = useMutation(
        async ({ id, status, targetServerId }: { id: string, status: string, targetServerId?: string }) => {
            return api.put(`/requests/${id}/status`, { status, targetServerId });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('admin-requests');
            }
        }
    );

    const submitToLidarrMutation = useMutation(
        async (id: string) => {
            return api.post(`/requests/${id}/submit`);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('admin-requests');
                alert('Submitted to Lidarr successfully!');
            },
            onError: (err: any) => {
                alert(`Submission failed: ${err.response?.data?.message || err.message}`);
            }
        }
    );

    if (isLoading) return <p>Loading requests...</p>;

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {requests?.map((req) => (
                        <tr key={req.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.artistName}</div>
                                <div className="text-xs text-gray-500">{req.artistMbid}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      req.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'}`}>
                                    {req.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {req.status === 'pending' && (
                                    <div className="flex items-center justify-end space-x-4">
                                        {lidarrServers.length > 1 && !req.targetServerId && (
                                            <select
                                                className="text-xs rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                value={selectedServers[req.id] || ''}
                                                onChange={(e) => setSelectedServers({...selectedServers, [req.id]: e.target.value})}
                                            >
                                                <option value="">Select Lidarr</option>
                                                {lidarrServers.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button
                                            onClick={() => updateStatusMutation.mutate({
                                                id: req.id,
                                                status: 'approved',
                                                targetServerId: selectedServers[req.id] || req.targetServerId
                                            })}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {req.status === 'approved' && (
                                    <button
                                        onClick={() => submitToLidarrMutation.mutate(req.id)}
                                        className="text-green-600 hover:text-green-900"
                                    >
                                        Submit to Lidarr
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ServersManager() {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const { data: servers, isLoading } = useQuery<ServerInstance[]>(
        'admin-servers',
        async () => {
            const res = await api.get('/instances');
            return res.data;
        }
    );

    const deleteMutation = useMutation(
        async (id: string) => {
            return api.delete(`/instances/${id}`);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('admin-servers');
            }
        }
    );

    if (isLoading) return <p>Loading servers...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Configured Servers</h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Add Server
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servers?.map((server) => (
                    <div key={server.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-lg font-bold">{server.name}</h4>
                                <p className="text-sm text-gray-500 uppercase">{server.type}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${server.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {server.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <p>URL: {server.baseUrl}</p>
                            {server.username && <p>Username: {server.username}</p>}
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => deleteMutation.mutate(server.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && <AddServerModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
}

function AddServerModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        type: 'navidrome',
        baseUrl: '',
        apiKey: '',
        username: ''
    });

    const addMutation = useMutation(
        async (data: any) => {
            return api.post('/instances', data);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('admin-servers');
                onClose();
            },
            onError: (err: any) => {
                alert(`Failed to add server: ${err.response?.data?.message || err.message}`);
            }
        }
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Add New Server</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="navidrome">Navidrome (Subsonic)</option>
                            <option value="lidarr">Lidarr</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Base URL</label>
                        <input
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                            placeholder="http://192.168.1.100:4533"
                            value={formData.baseUrl}
                            onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{formData.type === 'navidrome' ? 'Password' : 'API Key'}</label>
                        <input
                            type="password"
                            className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                            value={formData.apiKey}
                            onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                        />
                    </div>
                    {formData.type === 'navidrome' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                    <button
                        onClick={() => addMutation.mutate(formData)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Add Server
                    </button>
                </div>
            </div>
        </div>
    );
}
