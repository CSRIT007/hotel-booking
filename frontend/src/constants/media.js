export const PROPERTY_IMAGES = [
  { value: '/images/services-1.jpg', label: 'City hotel' },
  { value: '/images/image_4.jpg', label: 'Grand facade' },
  { value: '/images/image_2.jpg', label: 'Lobby view' },
  { value: '/images/image_3.jpg', label: 'Lounge' },
  { value: '/images/image_5.jpg', label: 'Courtyard' },
]

export const ROOM_IMAGES = [
  { value: '/images/room-1.jpg', label: 'Suite' },
  { value: '/images/room-2.jpg', label: 'Standard' },
  { value: '/images/room-3.jpg', label: 'Family' },
  { value: '/images/room-4.jpg', label: 'Deluxe' },
  { value: '/images/room-5.jpg', label: 'Twin' },
  { value: '/images/room-6.jpg', label: 'Premium' },
]

export const DEFAULT_ROOM_PHOTO = '/images/room-1.jpg'

export function roomCover(room) {
  const cover = typeof room?.image === 'string' ? room.image.trim() : ''
  if (cover) return cover
  const extra = Array.isArray(room?.images) ? room.images.find((src) => typeof src === 'string' && src.trim()) : ''
  return extra || DEFAULT_ROOM_PHOTO
}

export function onRoomPhotoError(e) {
  if (e?.target && e.target.src && !e.target.src.endsWith(DEFAULT_ROOM_PHOTO)) {
    e.target.src = DEFAULT_ROOM_PHOTO
  }
}
