import parser from 'cron-parser';


function * datesFromCron(cronExpression, fromDate, toDate) {
    const options = {
        currentDate: fromDate,
        endDate: toDate,
        iterator: true,
        utc: true,
    };
    const interval = parser.parseExpression(cronExpression, options);

    while (interval.hasNext()) {
        yield interval.next().value;
    }
}

export default datesFromCron;