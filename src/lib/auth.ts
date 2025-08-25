import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// schema for login
const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function authorizeCredentials(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);

  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  // if user or passwordHash not found
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;

  // if password not match
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  // success login
  return { id: user.id, email: user.email, name: user.name };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      authorize: authorizeCredentials,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
        token.email = user.email!;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user = {
          ...(session.user || {}),
          id: token.sub,
          email: token.email as string,
          name: token.name as string,
        } as any;
      }
      return session;
    },
  },
};
