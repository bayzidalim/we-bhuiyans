/**
 * Member Schema Validation and Utilities
 *
 * This module defines the Zod schema for a family tree member and provides
 * validation, ID generation, and relationship consistency helpers.
 *
 * FUTURE-PROOFING: New optional fields (photos, occupation, placeOfBirth, etc.)
 * can be added to the schema without breaking existing code.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------
// Core Enums
// ---------------------------------------------------------------------
export const GenderEnum = z.enum(['male', 'female', 'other']);
export type Gender = z.infer<typeof GenderEnum>;

export const StatusEnum = z.enum(['living', 'deceased']);
export type Status = z.infer<typeof StatusEnum>;

// ---------------------------------------------------------------------
// Member Schema
// ---------------------------------------------------------------------
export const MemberSchema = z.object({
    // Required fields
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    gender: GenderEnum,

    // Optional fields
    birthYear: z
        .number()
        .int()
        .min(1800, 'Birth year too early')
        .max(new Date().getFullYear(), 'Birth year in the future')
        .nullable()
        .optional(),
    deathYear: z
        .number()
        .int()
        .min(1800, 'Death year too early')
        .max(new Date().getFullYear(), 'Death year in the future')
        .nullable()
        .optional(),
    status: StatusEnum.optional(),
    notes: z.string().max(500, 'Notes are too long').optional(),

    // Relationship arrays – always present (may be empty)
    spouseIds: z.array(z.string()),
    childrenIds: z.array(z.string()),

    // -------------------------------------------------------------------
    // FUTURE‑PROOFING: Add new optional fields below
    // -------------------------------------------------------------------
    // photo: z.string().url().optional(),
    // occupation: z.string().max(100).optional(),
    // placeOfBirth: z.string().max(200).optional(),
});

export type Member = z.infer<typeof MemberSchema>;

// ---------------------------------------------------------------------
// Form Input Schema (used before an ID is generated)
// ---------------------------------------------------------------------
export const MemberFormInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    gender: GenderEnum,
    birthYear: z.union([z.number().int().min(1800).max(new Date().getFullYear()), z.literal('')]).optional(),
    deathYear: z.union([z.number().int().min(1800).max(new Date().getFullYear()), z.literal('')]).optional(),
    status: StatusEnum.optional(),
    notes: z.string().max(500).optional(),
    spouseIds: z.array(z.string()),
    childrenIds: z.array(z.string()),
});

export type MemberFormInput = z.infer<typeof MemberFormInputSchema>;

// ---------------------------------------------------------------------
// Validation Context & Result Types
// ---------------------------------------------------------------------
export interface ValidationContext {
    existingMembers: Member[];
    /**
     * When editing an existing member, pass its own ID so that uniqueness
     * checks ignore the current record.
     */
    currentMemberId?: string;
}

export interface ValidationResult {
    success: boolean;
    errors: string[];
}

// ---------------------------------------------------------------------
// Core Validation Function
// ---------------------------------------------------------------------
/**
 * Validate a member against the schema and business rules.
 *
 * Business Rules enforced:
 *   1️⃣ ID must be unique (unless editing the same record)
 *   2️⃣ birthYear < deathYear (if both supplied)
 *   3️⃣ All spouseIds reference existing members and are not self‑referencing
 *   4️⃣ All childrenIds reference existing members and are not self‑referencing
 *   5️⃣ No circular ancestry (a child cannot also be an ancestor)
 */
export function validateMember(
    member: unknown,
    context: ValidationContext
): ValidationResult {
    const errors: string[] = [];

    // ----- Schema validation -----
    const schemaResult = MemberSchema.safeParse(member);
    if (!schemaResult.success) {
        schemaResult.error.errors.forEach((e) => {
            errors.push(`${e.path.join('.')} – ${e.message}`);
        });
        return { success: false, errors };
    }

    const data = schemaResult.data;
    const existingIds = new Set(
        context.existingMembers
            .filter((m) => m.id !== context.currentMemberId)
            .map((m) => m.id)
    );

    // ----- ID uniqueness -----
    if (existingIds.has(data.id)) {
        errors.push(`ID "${data.id}" already exists.`);
    }

    // ----- Birth / Death logic -----
    if (data.birthYear && data.deathYear && data.birthYear >= data.deathYear) {
        errors.push('Birth year must be earlier than death year.');
    }

    // ----- Spouse references -----
    for (const sid of data.spouseIds) {
        if (sid === data.id) {
            errors.push('A member cannot be their own spouse.');
            continue;
        }
        if (!existingIds.has(sid) && sid !== context.currentMemberId) {
            errors.push(`Spouse ID "${sid}" does not exist.`);
        }
    }

    // ----- Children references -----
    for (const cid of data.childrenIds) {
        if (cid === data.id) {
            errors.push('A member cannot be their own child.');
            continue;
        }
        if (!existingIds.has(cid) && cid !== context.currentMemberId) {
            errors.push(`Child ID "${cid}" does not exist.`);
        }
    }

    // ----- Circular ancestry detection -----
    const circular = detectCircularAncestry(data, context.existingMembers);
    if (circular) errors.push(circular);

    return { success: errors.length === 0, errors };
}

// ---------------------------------------------------------------------
// Helper: Detect Circular Ancestry
// ---------------------------------------------------------------------
/**
 * Walks the parent‑child graph to see if any of the new member's children are
 * already ancestors of the member. Returns an error message or null.
 */
function detectCircularAncestry(member: Member, existingMembers: Member[]): string | null {
    const map = new Map(existingMembers.map((m) => [m.id, m]));
    map.set(member.id, member);

    // Build a reverse lookup: childId -> Set of parentIds
    const childToParents = new Map<string, Set<string>>();
    for (const m of map.values()) {
        for (const childId of m.childrenIds) {
            if (!childToParents.has(childId)) childToParents.set(childId, new Set());
            childToParents.get(childId)!.add(m.id);
        }
    }

    // Depth‑first search from each child back up to ancestors
    const visited = new Set<string>();
    function hasPathTo(targetId: string, currentId: string): boolean {
        if (currentId === targetId) return true;
        if (visited.has(currentId)) return false;
        visited.add(currentId);
        const parents = childToParents.get(currentId);
        if (!parents) return false;
        for (const p of parents) {
            if (hasPathTo(targetId, p)) return true;
        }
        return false;
    }

    for (const childId of member.childrenIds) {
        visited.clear();
        if (hasPathTo(member.id, childId)) {
            const child = map.get(childId);
            return `Circular ancestry detected: ${child?.name ?? childId} would be both ancestor and descendant.`;
        }
    }

    return null;
}

// ---------------------------------------------------------------------
// Utility: Generate a Unique ID
// ---------------------------------------------------------------------
export function generateMemberId(existingMembers: Member[]): string {
    const existing = new Set(existingMembers.map((m) => m.id));
    let counter = existingMembers.length + 1;
    let candidate = `p${counter}`;
    while (existing.has(candidate)) {
        counter++;
        candidate = `p${counter}`;
    }
    return candidate;
}

// ---------------------------------------------------------------------
// Relationship Consistency Helpers
// ---------------------------------------------------------------------
/**
 * Ensure a bi‑directional spouse relationship.
 * If A lists B as a spouse, B will also list A.
 */
export function ensureSpouseConsistency(
    members: Member[],
    memberAId: string,
    memberBId: string
): Member[] {
    return members.map((m) => {
        if (m.id === memberBId && !m.spouseIds.includes(memberAId)) {
            return { ...m, spouseIds: [...m.spouseIds, memberAId] };
        }
        return m;
    });
}

/**
 * Apply relationship consistency for a newly added/updated member.
 * Currently handles spouse reciprocity. Child relationships are stored only
 * on the parent side, so no extra work is required.
 */
export function applyRelationshipConsistency(
    members: Member[],
    newMember: Member
): Member[] {
    let updated = [...members];
    // Ensure spouses are mutual
    for (const spouseId of newMember.spouseIds) {
        updated = updated.map((m) => {
            if (m.id === spouseId && !m.spouseIds.includes(newMember.id)) {
                return { ...m, spouseIds: [...m.spouseIds, newMember.id] };
            }
            return m;
        });
    }
    return updated;
}

// ---------------------------------------------------------------------
// Helper: Create an empty form (client‑side)
// ---------------------------------------------------------------------
export function createEmptyMemberForm(): MemberFormInput {
    return {
        name: '',
        gender: 'male',
        birthYear: undefined,
        deathYear: undefined,
        status: 'living',
        notes: '',
        spouseIds: [],
        childrenIds: [],
    };
}
