import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// define the correct schema for registration
const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      // test the credentials input
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);

        if (!parsed.success) return null;

        // no such user or password not exists
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        // wrong password
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // success
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // if user first time logged in, add id and email to token
      if (user) {
        token.sub = user.id as string;
        token.email = user.email!;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // logging in, add id and email to session
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
