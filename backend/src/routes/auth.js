const fastify = require('fastify');
const pool = require('../config/database');
const supabase = require('../config/supabase');

async function authRoutes(fastify, options) {

const { requireProfile } = require('../middleware/auth');

  // --- GET /api/auth/me (Sync & Retrieve User) ---
  // Returns: { id, name, email, role, avatar_url }
  fastify.get('/me', { preHandler: requireProfile }, async (request, reply) => {
    try {
      const { user, profile } = request;
      
      // Standardize response structure as requested
      // profile has full_name, user has user_metadata.avatar_url
      return {
        id: profile.id,
        name: profile.full_name, // Mapping full_name -> name
        email: profile.email,
        role: profile.role,
        is_admin: profile.is_admin, // Keeping is_admin for frontend logic
        avatar_url: user.user_metadata?.avatar_url || null,
        // Also return raw profile just in case for other fields like status
        status: profile.status,
        auth_user_id: profile.auth_user_id
        // NOTE: Frontend 'MemberProfile' interface expects 'full_name', so 'name' might be redundant but adheres to prompt.
        // I will return BOTH to be safe for both 'contract' and existing frontend code.
        ,full_name: profile.full_name 
      };

    } catch (err) {
      request.log.error('Auth sync error:', err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

}

module.exports = authRoutes;
