export const toCategoryResponse = (category, wordCount = 0) => ({
  id: category.id,
  name: category.categoryName,
  iconKey: category.iconKey,
  iconUrl: category.iconUrl,
  displayOrder: category.displayOrder,
  wordCount,
});

export const toCategoryDeleteResponse = ({ categoryId, deletedWordCount }) => ({
  categoryId,
  deletedWordCount,
});
