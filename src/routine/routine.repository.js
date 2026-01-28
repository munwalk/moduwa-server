import prisma from "../config/prisma.config.js";

export const findRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.findMany({
    where: { userId },
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
  });
};
