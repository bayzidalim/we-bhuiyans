import React from 'react';
import { Member, MemberFormInput } from './memberSchema';
import { diffLines } from 'diff'; // lightweight diff library – we can implement simple diff manually if not installed

interface DiffPreviewProps {
  oldMembers: Member[];
  newMember: Member;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shows a JSON diff preview of the family tree after adding a new member.
 * Highlights the new member block and any relationship changes.
 */
export default function DiffPreview({ oldMembers, newMember, onConfirm, onCancel }: DiffPreviewProps) {
  // Build the new members array
  const updated = [...oldMembers, newMember];

  const oldJson = JSON.stringify({ members: oldMembers }, null, 2);
  const newJson = JSON.stringify({ members: updated }, null, 2);

  // Simple line‑by‑line diff (adds '+' for new lines)
  const diff = diffLines(oldJson, newJson);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Preview Changes</h3>
        <pre className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded text-sm font-mono">
          {diff.map((part, i) => {
            const color = part.added ? 'text-green-600' : part.removed ? 'text-red-600' : 'text-gray-800';
            const prefix = part.added ? '+' : part.removed ? '-' : ' ';
            return (
              <div key={i} className={color}>
                {prefix}{part.value}
              </div>
            );
          })}
        </pre>
        <div className="mt-4 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
            Confirm Save
          </button>
        </div>
      </div>
    </div>
  );
}
