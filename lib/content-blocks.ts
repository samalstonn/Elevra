import { ContentBlock } from "@prisma/client";

export const unchanged = (b: ContentBlock) => {
  const createdAtDate = new Date(b.createdAt);
  const updatedAtDate = new Date(b.updatedAt);

  return createdAtDate.getTime() === updatedAtDate.getTime();
};
