import { useState, useCallback } from 'react';
import { Member, MemberFormInput, generateMemberId, validateMember, ValidationContext, createEmptyMemberForm } from './memberSchema';
// FamilyTreeData import removed – not needed in this modal.
import DiffPreview from './DiffPreview';

interface AddMemberModalProps {
  /**
   * The raw family data (members array) currently displayed.
   */
  rawMembers: Member[];
  /**
   * Callback invoked after a successful save – the parent can re‑fetch data.
   */
  onSaveSuccess: () => void;
  /**
   * Close the modal.
   */
  onClose: () => void;
}

/**
 * A premium‑styled modal that collects information for a new family member.
 * It validates input with Zod, shows a diff preview, and persists the change
 * via the `/api/family-tree` endpoint.
 */
export default function AddMemberModal({ rawMembers, onSaveSuccess, onClose }: AddMemberModalProps) {
  const [form, setForm] = useState<MemberFormInput>(createEmptyMemberForm()); // The empty form creator is imported from memberSchema; no local definition needed.
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [newMember, setNewMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  // Populate relationship selectors with existing members (excluding the new one)
  const existingOptions = rawMembers.map((m) => ({ id: m.id, name: m.name }));

  const handleChange = (field: keyof MemberFormInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(() => {
    // Build the full member object (including generated ID)
    const id = generateMemberId(rawMembers);
    const member: Member = {
      id,
      name: form.name.trim(),
      gender: form.gender,
      birthYear: typeof form.birthYear === 'number' ? form.birthYear : null,
      deathYear: typeof form.deathYear === 'number' ? form.deathYear : null,
      status: form.status ?? undefined,
      notes: form.notes?.trim() ?? undefined,
      spouseIds: form.spouseIds,
      childrenIds: form.childrenIds,
    };

    // Validate against schema and business rules
    const ctx: ValidationContext = { existingMembers: rawMembers };
    const result = validateMember(member, ctx);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setNewMember(member);
    setShowPreview(true);
  }, [form, rawMembers]);

  const handleConfirmSave = async () => {
    if (!newMember) return;
    setSaving(true);
    try {
      const response = await fetch('/api/family-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newMember }),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Server error: ${txt}`);
      }
      // Success – inform parent to reload data
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  // Render UI – premium modal with glassmorphism & smooth animations
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-[Inter]">Add Family Member</h2>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mb-4 rounded bg-rose-50 p-3 text-rose-800 text-sm">
            <ul className="list-disc list-inside">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form fields – using Tailwind for rapid styling (premium look) */}
        <div className="grid grid-cols-1 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Birth Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
            <input
              type="number"
              value={form.birthYear ?? ''}
              onChange={(e) => handleChange('birthYear', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Death Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Death Year</label>
            <input
              type="number"
              value={form.deathYear ?? ''}
              onChange={(e) => handleChange('deathYear', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Spouse Multi‑select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spouses</label>
            <select
              multiple
              value={form.spouseIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                handleChange('spouseIds', selected);
              }}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            >
              {existingOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Children Multi‑select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
            <select
              multiple
              value={form.childrenIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                handleChange('childrenIds', selected);
              }}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            >
              {existingOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Preview'}
          </button>
        </div>

        {/* Diff preview overlay */}
        {showPreview && newMember && (
          <DiffPreview
            oldMembers={rawMembers}
            newMember={newMember}
            onConfirm={handleConfirmSave}
            onCancel={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
}


