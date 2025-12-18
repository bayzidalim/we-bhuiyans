'use client';

import { useState, useEffect } from 'react';
import { 
    fetchPlatformMembers, 
    createPlatformMember, 
    updatePlatformMember, 
    deletePlatformMember, 
    fetchAdminAPI 
} from '../../lib/api';

interface PlatformMember {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'family' | 'outsider' | 'historian' | 'guest';
    status: 'pending' | 'approved' | 'rejected';
    claimed_tree_person_id: string | null;
    tree_person_name?: string | null;
}

interface TreePerson {
    id: string;
    full_name: string;
}

export default function PlatformMembersPage() {
    const [members, setMembers] = useState<PlatformMember[]>([]);
    const [treePeople, setTreePeople] = useState<TreePerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<PlatformMember | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'guest',
        status: 'pending',
        claimed_tree_person_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [m, t] = await Promise.all([
                fetchPlatformMembers(),
                fetchAdminAPI('/members') // Fetching tree people
            ]);
            setMembers(m);
            setTreePeople(t);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                claimed_tree_person_id: formData.claimed_tree_person_id || null
            };

            if (editingMember) {
                await updatePlatformMember(editingMember.id, payload);
            } else {
                await createPlatformMember(payload);
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            alert('Error saving member');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete the social profile but NOT the tree person.')) return;
        try {
            await deletePlatformMember(id);
            loadData();
        } catch (err) {
            alert('Error deleting');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Social Platform Members</h1>
                    <p className="text-gray-500 mb-0">Manage users who can log in and post content.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingMember(null);
                        setFormData({ full_name: '', email: '', role: 'guest', status: 'pending', claimed_tree_person_id: '' });
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                >
                    + Add Social Member
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role / Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Claimed Person</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{m.full_name}</td>
                                    <td className="px-6 py-4 text-gray-600">{m.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black uppercase text-indigo-500">{m.role}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${
                                                m.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                m.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {m.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 italic">
                                        {m.tree_person_name || 'None'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingMember(m);
                                                    setFormData({
                                                        full_name: m.full_name,
                                                        email: m.email,
                                                        role: m.role,
                                                        status: m.status,
                                                        claimed_tree_person_id: m.claimed_tree_person_id || ''
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(m.id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-xs uppercase"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 font-[Inter]">
                                {editingMember ? 'Edit Member' : 'Add New Social Member'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                                    <input 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.full_name}
                                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
                                    <input 
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Role</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                            value={formData.role}
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                        >
                                            <option value="guest">Guest</option>
                                            <option value="family">Family</option>
                                            <option value="historian">Historian</option>
                                            <option value="outsider">Outsider</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                            value={formData.status}
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Claimed Tree Person (Optional)</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                                        value={formData.claimed_tree_person_id}
                                        onChange={e => setFormData({...formData, claimed_tree_person_id: e.target.value})}
                                    >
                                        <option value="">-- None --</option>
                                        {treePeople.map(tp => (
                                            <option key={tp.id} value={tp.id}>{tp.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:bg-black transition-all"
                                    >
                                        {editingMember ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
