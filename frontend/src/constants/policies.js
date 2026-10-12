export const policySections = [
  {
    id: 'booking',
    title: 'Booking & confirmation',
    short: 'How a request becomes a stay',
    paragraphs: [
      'A booking on this website is a request. The room is held for your dates once the front desk confirms it. Until then the status is pending, and another stay can still take the room if the hotel cannot confirm.',
      'You can request a stay with an account, or as a guest with your name, email, and phone. Optional password lets you sign in later and see the booking under My bookings.',
    ],
    bullets: [
      'Choose dates and guests, then Request booking on the room page.',
      'Staff confirm from the desk. Check My bookings or wait for our reply.',
      'The nightly rate and stay total shown at request are the quoted price for those dates.',
      'We may contact you if the room cannot be confirmed or if we need to offer another room.',
    ],
  },
  {
    id: 'check-in',
    title: 'Check-in & check-out',
    short: 'Arrival and departure times',
    paragraphs: [
      'Rooms are prepared after the previous guest leaves. Please keep to house times unless the desk has noted a late arrival or late checkout.',
    ],
    bullets: [
      'Check-in from 2:00 pm.',
      'Check-out until 12:00 pm.',
      'Front desk hours: daily, 7:00 am – 10:00 pm.',
      'Tell us if you will arrive after desk hours so we can hold a key.',
      'Bring photo ID for the lead guest. The name should match the booking.',
      'Early check-in or late checkout depends on the room being free and is arranged with the desk, not guaranteed online.',
    ],
  },
  {
    id: 'cancellation',
    title: 'Cancellation & changes',
    short: 'How to change or cancel a stay',
    paragraphs: [
      'If you booked with an account, open My bookings to cancel or change dates yourself while the stay is still pending or confirmed and check-in has not started. You can also write through Contact or call the desk.',
    ],
    bullets: [
      'Pending requests: cancel or change dates on My bookings anytime before the hotel confirms.',
      'Confirmed stays: cancel or move dates on My bookings until the check-in date. On the arrival day, call the desk.',
      'Date changes use the rate for the new nights. The quoted total may change, and the room must still be open.',
      'If you do not arrive and do not contact us, the stay may be marked no-show and the dates released.',
      'A cancelled booking stays in My bookings as cancelled. You can request a new room anytime.',
    ],
  },
  {
    id: 'house-rules',
    title: 'House rules',
    short: 'During your stay',
    paragraphs: [
      'Smile Hotel MS is a small city house. These rules keep rooms ready for the next guest and the building quiet at night.',
    ],
    bullets: [
      'Stay within the guest count listed on the room. Extra guests need the desk’s agreement and may not fit the room.',
      'Children count toward the guest total.',
      'Quiet hours 10:00 pm – 7:00 am.',
      'No smoking in rooms or indoor corridors. Use outdoor areas the desk shows you.',
      'Pets are not accepted unless arranged in writing before arrival.',
      'Visitors should check in at the desk. Overnight visitors must be added to the booking.',
      'Do not move furniture or use cooking equipment that is not provided in the room.',
      'Loss, damage, or a missing key may be charged on the stay folio.',
    ],
  },
  {
    id: 'payment',
    title: 'Rates & payment',
    short: 'What you pay and when',
    paragraphs: [
      'The price on the room page is the nightly rate for your dates. The stay total is quoted before you request. There is no online card charge at booking; you pay at the hotel unless staff have arranged another method.',
    ],
    bullets: [
      'Pay the quoted stay at the front desk on arrival, or as the confirmation message states.',
      'Extras during the stay (for example drinks or simple items) go on the folio and are settled before checkout.',
      'We do not add surprise room fees for a standard stay. Government tax, if any, is included in the quoted total unless the confirmation says otherwise.',
      'Currency on the website is the hotel’s listed currency.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    short: 'How we use your details',
    paragraphs: [
      'We collect only what we need to take a booking and run the house: name, email, phone, stay dates, guest count, and optional account login. Staff use this to confirm the room, reach you, and keep the folio.',
    ],
    bullets: [
      'Booking details are visible to hotel staff on the operations desk.',
      'We do not sell guest lists or contact details.',
      'An optional password is stored only to sign you in. We never email your password.',
      'To update or remove an account, write to the desk from the Contact page with the email on the booking.',
      'Messages you send on Contact are stored so staff can reply.',
    ],
  },
]

export const policyLinks = [
  { id: 'booking', label: 'Stay policies', to: { name: 'Policies' } },
  { id: 'cancellation', label: 'Cancellation', to: { name: 'Policies', hash: '#cancellation' } },
  { id: 'house-rules', label: 'House rules', to: { name: 'Policies', hash: '#house-rules' } },
  { id: 'privacy', label: 'Privacy', to: { name: 'Policies', hash: '#privacy' } },
]
