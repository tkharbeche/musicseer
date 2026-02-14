'use client';

import { useQuery } from 'react-query';
import api from '@/lib/api';
import { Request as MusicRequest } from '@musicseer/shared-types';

export default function UserRequestsPage() {
    const { data: requests, isLoading } = useQuery<MusicRequest[]>(
        'my-requests',
        async () => {
            const res = await api.get('/requests');
            return res.data;
        }
    );

    if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading your requests...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">My Requests</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {requests?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>You haven't requested any music yet.</p>
                        <a href="/discovery" className="text-indigo-600 hover:underline mt-2 inline-block">Explore trending artists</a>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {requests?.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.artistName}</div>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
