'use client';

import { useQuery } from 'react-query';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function UserRequests() {
    const { data: requests, isLoading } = useQuery('my-requests', async () => {
        const res = await axios.get(`${API_BASE}/requests`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Requests</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading your requests...</div>
                ) : requests?.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 mb-4">You haven't made any requests yet.</p>
                        <a href="/dashboard" className="text-blue-600 font-semibold">Discover artists to request</a>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Artist / Album</th>
                                <th className="px-6 py-3">Requested On</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests?.map((req: any) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{req.artistName}</div>
                                        {req.albumName && <div className="text-xs text-gray-500">{req.albumName}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs capitalize ${
                                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                            req.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            req.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
