# Uwrite

> A tiny web application for writing, organizing and reading novels/journals.
> Projects/Chapters hierarchy, rich text editor (Tiptap) with autosave & local draft recovery, and social features (publish & likes &comments).

![Node](https://img.shields.io/badge/Node-%3E%3D18-339933?logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?logo=pnpm)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-336791?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Jest](https://img.shields.io/badge/Jest-tests-C21325?logo=jest)

## Features

1. **Account system**: register / login / change password / logout
2. **writing modules**: projects (novels) with chapters creation & editing
3. **reading modules**: reading public projects and its published chapter, give likes or comments
4. **Rich text**: Tiptap editor with autosave & local draft recovery  
5. **Views**: dashboard (recent projects/chapters), project detail page, public channel
6. **Responsive UI**: Tailwind

## Todo
1. **improve comments feature**: comment others' comments
2. **search and tag**: tag projects and add feature allow users search specific projects
3. **deploy**: deploy through Vercel

---

## Tech Stack

- **Frontend/App**: Next.js 14 (App Router), React, TypeScript, Tailwind, Tiptap editor  
- **Backend**: Next.js Route Handlers / API Routes, NextAuth.js, bcrypt 
- **DataBase & ORM**: PostgreSQL, Prisma ORM 
- **Tooling/CI**: pnpm, ESLint, GitHub Actions  
- **Testing**: Jest

---

## Quick Start

### 1) Clone & Install
```bash
git clone https://github.com/kyra-yang/Uwrite.git
cd Uwrite
pnpm install
pnpm prisma migrate dev -n init
pnpm dev
