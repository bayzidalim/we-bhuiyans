import Link from "next/link";
import MembersTable from "./MembersTable";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Members</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Complete list of registered family members in the genealogy database.
          </p>
        </div>
        <Link
          href="/admin/members/add"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Member
        </Link>
      </div>
      
      <MembersTable />
    </div>
  );
}
