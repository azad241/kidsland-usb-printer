export const getTicketTypeDisplay = (type: string) => {
  return type
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};
