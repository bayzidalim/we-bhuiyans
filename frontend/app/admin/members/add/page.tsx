import Link from "next/link";
import AddMemberForm from "./AddMemberForm";

export default function AddMemberPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Family Member</h1>
          <p className="text-gray-600 mt-1 text-sm">
            You can leave unknown fields empty.
          </p>
        </div>
        <Link
          href="/admin/members"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Members
        </Link>
      </div>

      <div className="bg-white p-6 shadow rounded-lg border border-gray-200">
        <AddMemberForm />
      </div>
    </div>
  );
}
