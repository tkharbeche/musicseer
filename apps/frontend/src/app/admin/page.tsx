'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'instances' | 'requests'>('instances');
    const queryClient = useQueryClient();

    // Instances Query
    const { data: instances } = useQuery('instances', async () => {
        const res = await axios.get(`${API_BASE}/instances`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    // All Requests Query (Admin view)
    const { data: allRequests } = useQuery('all-requests', async () => {
        const res = await axios.get(`${API_BASE}/requests`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    const updateRequestMutation = useMutation(async ({ id, status }: { id: string, status: string }) => {
        await axios.patch(`${API_BASE}/requests/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    }, {
        onSuccess: () => queryClient.invalidateQueries('all-requests')
    });

    const updateTargetServerMutation = useMutation(async ({ id, targetServerId }: { id: string, targetServerId: string }) => {
        await axios.patch(`${API_BASE}/requests/${id}/status`, { targetServerId }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    }, {
        onSuccess: () => queryClient.invalidateQueries('all-requests')
    });

    const submitToLidarrMutation = useMutation(async (id: string) => {
        await axios.post(`${API_BASE}/requests/${id}/submit`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
    }, {
        onSuccess: () => queryClient.invalidateQueries('all-requests')
    });

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('instances')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'instances' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                >
                    Server Instances
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                >
                    Pending Requests
                </button>
            </div>

            {activeTab === 'instances' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Managed Servers</h2>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ Add Server</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">URL</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {instances?.map((instance: any) => (
                                    <tr key={instance.id}>
                                        <td className="px-6 py-4 font-medium">{instance.name}</td>
                                        <td className="px-6 py-4 capitalize">{instance.type}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm truncate max-w-xs">{instance.baseUrl}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button className="text-blue-600 hover:underline mr-3">Edit</button>
                                            <button className="text-red-600 hover:underline">Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Manage Requests</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Artist</th>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Target Lidarr</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allRequests?.map((req: any) => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 font-medium">{req.artistName}</td>
                                        <td className="px-6 py-4">{req.user?.username || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="text-sm border rounded p-1"
                                                value={req.targetServerId || ''}
                                                onChange={(e) => updateTargetServerMutation.mutate({ id: req.id, targetServerId: e.target.value })}
                                                disabled={req.status === 'completed'}
                                            >
                                                <option value="">Select Lidarr...</option>
                                                {instances?.filter((i: any) => i.type === 'lidarr').map((i: any) => (
                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs capitalize ${
                                                req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                req.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'approved' })}
                                                        className="text-green-600 hover:underline mr-3"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'approved' && (
                                                <button
                                                    onClick={() => submitToLidarrMutation.mutate(req.id)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                                >
                                                    Send to Lidarr
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
