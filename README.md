# Uwrite

A tiny web application for writing and organizing novels.  
Supports **project/chapters** hierarchy, a rich text editor, autosave, tags, and search, and showing them with another users(this function will meet in the future).  

## Features
1.  **Account system**: register / login / change password / logout / rename 
2.  **Novel mode**: project (novel) with chapters creating/modifying
3.  **text editor**: Tiptap with autosave and local draft recovery  
4.  **Views**: dashboard (recent projects/chapters), project detail page  
5.  **Search & tags**: fuzzy search by title, tags, or content  
6.  **Responsive UI**: Tailwind CSS, mobile-friendly  
7.  **One-click deployment**: Vercel + Neon (Postgres)
8.  Export (future): export projects as Markdown/ZIP
9.  show and comment(future): show your project and other could leave comments

---

## 🛠 Tech Stack

### Frontend
- [Next.js 14 (App Router)](https://nextjs.org/)  
- [React](https://react.dev/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [Tailwind CSS](https://tailwindcss.com/)  
- [Tiptap](https://tiptap.dev/) editor  

### Backend
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)  
- [Prisma ORM](https://www.prisma.io/)  
- [PostgreSQL](https://www.postgresql.org/)  
- [NextAuth.js](https://next-auth.js.org/) (Credentials Provider)  
- [bcrypt](https://www.npmjs.com/package/bcrypt)  

### Tools & Deployment
- [Vercel](https://vercel.com/) (frontend + API hosting)  
- [Neon](https://neon.tech/) / [Supabase](https://supabase.com/) (Postgres hosting)  
- [GitHub Actions](https://github.com/features/actions) (CI/CD)  

### Testing
- - [Jest](https://jestjs.io/)

---

## Project Structure
