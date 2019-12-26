const THING_TODO = 'TTD';
const ORGANISER = 'ORG';
const USER = 'USR';
const BOOKING = 'BKG';
const FAVORITE = 'FAV';

const gsi1sk = (status, orgId) => `${status}#${orgId}`;

const gsi1skBooking = (status, userId, date, ttdId) => `${status}#${userId}#${date}#${ttdId}`;

const gsi1skFavorite = (status, userId) => `${FAVORITE}#${status}#${userId}`;


export {
    THING_TODO,
    ORGANISER,
    USER,
    BOOKING,
    FAVORITE,
    gsi1sk,
    gsi1skBooking,
    gsi1skFavorite
};