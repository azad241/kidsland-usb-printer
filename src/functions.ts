export const getTicketTypeDisplay = (type: string) => {
  switch (type) {
    case 'free':
      return 'Free'
    case 'regular':
      return 'Regular'
    case 'premium':
      return 'Premium'
    case 'offer':
      return 'Offer'
    case 'vip':
      return 'VIP'
    case 'deluxe':
      return 'Deluxe'
    case 'custom':
      return 'Custom'
    default:
      return type
  }
}

