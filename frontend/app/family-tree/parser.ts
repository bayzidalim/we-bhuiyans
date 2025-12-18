
import { FamilyTreeData, TreeEdge, TreeNode } from './types';

interface RawMember {
    id: string;
    name: string;
    gender: 'male' | 'female';
    spouseIds?: string[];
    childrenIds?: string[];
    birthYear?: number;
    deathYear?: number;
    status?: 'living' | 'deceased';
    photo?: string;
}

interface RawFamilyData {
    members: RawMember[];
}

export function parseFamilyData(rawData: RawFamilyData): FamilyTreeData {
    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];
    const processedSpousePairs = new Set<string>();

    rawData.members.forEach((member) => {
        // 1. Create Node
        nodes.push({
            id: member.id,
            name: member.name,
            gender: member.gender,
            birthYear: member.birthYear,
            deathYear: member.deathYear,
            status: member.status,
        });

        // 2. Create Spouse Edges
        if (member.spouseIds) {
            member.spouseIds.forEach((spouseId) => {
                // Ensure consistent key for deduplication (e.g., "minId-maxId")
                const [a, b] = [member.id, spouseId].sort();
                const key = `${a} -${b} `;

                if (!processedSpousePairs.has(key)) {
                    edges.push({
                        from: member.id,
                        to: spouseId,
                        type: 'spouse',
                    });
                    processedSpousePairs.add(key);
                }
            });
        }

        // 3. Create Parent-Child Edges
        // NOTE: The JSON defines childrenIds on the PARENT.
        // So if A has child B, we create edge A -> B (parent -> child)
        if (member.childrenIds) {
            member.childrenIds.forEach((childId) => {
                edges.push({
                    from: member.id,
                    to: childId,
                    type: 'parent',
                });
            });
        }
    });

    return {
        meta: {
            familyName: "Bhuiyan Family",
            exportedAt: new Date().toISOString(),
            version: 1,
        },
        nodes,
        edges,
    };
}
