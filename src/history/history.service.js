import {
  findAllByUserId,
  findById,
  deleteById,
  deleteAllByUserId
} from './history.repository.js';
import { NotFoundError } from '../errors/app.error.js';

const getAllHistory = async (userId) => {
  return await findAllByUserId(userId);
};

const deleteHistory = async (historyId, userId) => {
  const history = await findById(historyId, userId);
  if (!history) {
    throw new NotFoundError('해당 대화 이력을 찾을 수 없습니다');
  }
  await deleteById(historyId, userId);
  return { deletedId: historyId };
};

const deleteAllHistory = async (userId) => {
  const result = await deleteAllByUserId(userId);
  return { deletedCount: result.count };
};

export { getAllHistory, deleteHistory, deleteAllHistory };