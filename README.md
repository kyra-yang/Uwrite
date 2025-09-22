# Uwrite

## A tiny web application for writing, organizing and reading novels/journals.
> Projects/Chapters hierarchy, rich text editor (Tiptap) with autosave & local draft recovery, and social features (publish & likes &comments).

![uWrite home Page](public/looklike.png)
## Features

1. **Account system**: register / login / change password / logout
2. **writing modules**: projects (novels) with chapters creation & editing
3. **reading modules**: reading public projects and its published chapter, give likes or comments
4. **Rich text**: Tiptap editor with autosave & local draft recovery  
5. **Views**: dashboard (recent projects/chapters), project detail page, public channel
6. **Responsive UI**: Tailwind

## Todo in future
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

### Clone & Install
```bash
git clone https://github.com/kyra-yang/Uwrite.git
cd Uwrite
pnpm install
pnpm prisma migrate dev -n init
pnpm dev
```

## License

Licensed under the [MIT license](LICENSE.md).

### Notes
I developed this project with AI's assistant, 
but all code was reviewed, adapted, and tested by myself.