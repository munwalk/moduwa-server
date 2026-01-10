export const toPm02CategoryResponse = (userCategory) => ({
  id: userCategory.id,
  name: userCategory.categoryName,
  iconKey: userCategory.iconKey,
  iconUrl: userCategory.iconUrl,
  displayOrder: userCategory.displayOrder,
});

export const toPm02CategoryDeleteResponse = (categoryId) => ({
  id: categoryId,
});
