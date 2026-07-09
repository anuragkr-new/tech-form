import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  {
    key: "email",
    label: "Email id",
    type: "email",
    order: 0,
    required: true,
    isSystem: true,
    options: [] as string[],
  },
  {
    key: "team_name",
    label: "Team Name",
    type: "select",
    order: 1,
    required: true,
    isSystem: false,
    options: ["Sales", "Onboarding", "Customer Success"],
  },
  {
    key: "target_goal",
    label: "Target Goal",
    type: "select",
    order: 2,
    required: true,
    isSystem: false,
    options: [
      "New Live Revenue (Onboarding)",
      "New Contracted Revenue (Sales)",
      "Expansion (CS)",
      "Churn Prevention (CS)",
    ],
  },
  {
    key: "related_product",
    label: "Related Product",
    type: "select",
    order: 3,
    required: false,
    isSystem: false,
    options: ["VINI", "Studio", "Platform"],
  },
  {
    key: "description",
    label: "Description of Requirement",
    type: "textarea",
    order: 4,
    required: true,
    isSystem: false,
    options: [] as string[],
  },
  {
    key: "impact",
    label: "Impact (Why?)",
    type: "textarea",
    order: 5,
    required: false,
    isSystem: false,
    options: [] as string[],
  },
  {
    key: "when_needed",
    label: "When do you need it?",
    type: "select",
    order: 6,
    required: true,
    isSystem: false,
    options: ["Within 7 days", "Within 15 days", "Within 30 days", ">30 days"],
  },
  {
    key: "reference",
    label: "Reference or Example Scenario",
    type: "text",
    order: 7,
    required: false,
    isSystem: false,
    options: [] as string[],
  },
  {
    key: "dealer_name",
    label: "Related Dealer Name",
    type: "text",
    order: 8,
    required: false,
    isSystem: false,
    options: [] as string[],
  },
];

async function main() {
  const existingCount = await prisma.question.count();
  if (existingCount > 0) {
    console.log("Questions already seeded, skipping.");
    return;
  }

  for (const question of questions) {
    await prisma.question.create({
      data: {
        key: question.key,
        label: question.label,
        type: question.type,
        order: question.order,
        required: question.required,
        isSystem: question.isSystem,
        options: {
          create: question.options.map((label, index) => ({
            label,
            order: index,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
