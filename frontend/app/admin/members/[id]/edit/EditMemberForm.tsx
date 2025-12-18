'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/api';

interface EditMemberFormProps {
  memberId: string;
}

export default function EditMemberForm({ memberId }: EditMemberFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    birth_year: '',
    death_year: '',
    father_id: '',
    mother_id: '',
  });
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [memberData, allMembers] = await Promise.all([
            apiFetch(`/admin/members/${memberId}`),
            apiFetch('/admin/members')
        ]);
        
        setFormData({
            full_name: memberData.full_name || '',
            gender: memberData.gender || '',
            birth_year: memberData.birth_year ? String(memberData.birth_year) : '',
            death_year: memberData.death_year ? String(memberData.death_year) : '',
            father_id: memberData.father_id || '',
            mother_id: memberData.mother_id || '',
        });

        setMembers(allMembers);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [memberId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Prepare payload
    const payload = {
      full_name: formData.full_name,
      gender: formData.gender || null,
      birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
      death_year: formData.death_year ? parseInt(formData.death_year) : null,
      father_id: formData.father_id || null,
      mother_id: formData.mother_id || null,
    };

    try {
      await apiFetch(`/admin/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      // Redirect on success
      router.push('/admin/members');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update member');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading member details...</div>;
  }

  // Filter out self from parent options
  const parentOptions = members.filter(m => m.id !== memberId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          value={formData.full_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select Gender (Optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="birth_year" className="block text-sm font-medium text-gray-700">
            Birth Year
          </label>
          <input
            type="number"
            id="birth_year"
            name="birth_year"
            value={formData.birth_year}
            onChange={handleChange}
            placeholder="YYYY"
            min="1000"
            max={new Date().getFullYear()}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="death_year" className="block text-sm font-medium text-gray-700">
            Death Year
          </label>
          <input
            type="number"
            id="death_year"
            name="death_year"
            value={formData.death_year}
            onChange={handleChange}
            placeholder="YYYY"
            min="1000"
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Relationships</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="father_id" className="block text-sm font-medium text-gray-700">
                Father
            </label>
            <select
              id="father_id"
              name="father_id"
              value={formData.father_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Unknown / None</option>
              {parentOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} {m.birth_year ? `(${m.birth_year})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="mother_id" className="block text-sm font-medium text-gray-700">
                Mother
            </label>
            <select
              id="mother_id"
              name="mother_id"
              value={formData.mother_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Unknown / None</option>
              {parentOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} {m.birth_year ? `(${m.birth_year})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end space-x-3">
        <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
            {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
