
## Instalação
npm install prisma
npm install @prisma/client
npm istanll openai
npm install @neondatabase/serverless

npx prisma init


generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "postgresql"
}


model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tasks Task[]
}


model Task {
  id String @id @default(uuid())
  title String
  description String?
  status String 
  priority String
  category String
  userId String
  user User @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  aiLogs Ailog[]
}

model Ailog{
  id String @id @default(uuid())
  taskId String
  task Task @relation(fields: [taskId], references: [id])
  prompt String
  response String
  model String
  createdAt DateTime @default(now())
}

npx prisma db push
Response: Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-green-mode-atbuekr3-pooler.c-9.us-east-1.aws.neon.tech"

🚀  Your database is now in sync with your Prisma schema. Done in 4.80s




## Getting Started

First, run the development server:

```bash
npm run dev# full-stack-integracao-ia
# full-stack-integracao-ia
