export const getRandomString = (slice: number = 4) => {
  const random = Math.random().toString(36).substring(2).slice(0, slice);
  const time = Date.now().toString(36).slice(0, slice);
  return `${random}${time}`;
};
