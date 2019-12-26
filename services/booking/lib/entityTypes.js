const THING_TODO = 'TTD';
const ORGANISER = 'ORG';
const USER = 'USR';
const BOOKING = 'BKG';

const gsi1sk = (status, orgId) => `${status}#${orgId}`;

const gsi1skBooking = (status, userId, date, ttdId) => `${status}#${userId}#${date}#${ttdId}`;

export {
    THING_TODO,
    ORGANISER,
    USER,
    BOOKING,
    gsi1sk,
    gsi1skBooking
};