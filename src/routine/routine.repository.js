import prisma from "../config/prisma.config.js";

// GET
export const findRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.findMany({
    where: { userId },
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
  });
};

// POST
export const createRoutineMessage = async ({
  userId,
  message,
  daysOfWeek,
  scheduledTime,
}) => {
  return prisma.routineMessage.create({
    data: {
      userId,
      message,
      daysOfWeek,
      scheduledTime,
      isActive: true,
    },
  });
};

// PATCH
export const findRoutineById = async ({ id }) => {
  return prisma.routineMessage.findUnique({ where: { id } });
};

export const updateRoutineMessage = async ({ id, data }) => {
  return prisma.routineMessage.update({
    where: { id },
    data,
  });
};

// DELETE
export const deleteRoutineMessagesByIds = async ({ userId, ids }) => {
  return prisma.routineMessage.deleteMany({
    where: {
      userId,
      id: { in: ids },
    },
  });
};

export const deleteAllRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.deleteMany({
    where: { userId },
  });
};
