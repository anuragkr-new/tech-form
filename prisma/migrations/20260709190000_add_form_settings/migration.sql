-- CreateTable
CREATE TABLE "FormSettings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSettings_pkey" PRIMARY KEY ("id")
);

-- Seed default form header
INSERT INTO "FormSettings" ("id", "title", "subtitle", "updatedAt")
VALUES (
    'default',
    'JAS Targets Requirements',
    'Submit your technical requirements for JAS targets. Signed in as {email}.',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
