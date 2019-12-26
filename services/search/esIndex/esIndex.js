import logger from '@dazn/lambda-powertools-logger';
import { max, min, parseISO, format, addDays, compareAsc } from 'date-fns';
import datesFromCron from '../lib/genDates';
import { USER } from '../lib/entityTypes';

const esIndex = ({ es, ddb, tableName, index }) => async (event) => {

    logger.debug('received event', { event });

    const enrich = ({ docId, body, organiserName }) => ({ docId, body: enrichDocument(body, organiserName) });

    const snsMessage = event.Records[0].Sns.Message;

    const docs = JSON.parse(snsMessage).Records;

    const orgNamesById = await fetchOrganiserNamesForDocs(ddb, tableName, docs);

    const toBeIndexed = docs.map(doc => ({
        docId: doc.id,
        body: doc,
        organiserName: orgNamesById[doc.orgId]
    })).map(enrich);

    return await indexDocuments(es, index, toBeIndexed);
};

const organisersByIds = async (ddb, tableName, ids) => {

    const keys = ids.map(id => ({
        id,
        sk: USER
    }));

    const request = {
        RequestItems: {
            [tableName]: {
                Keys: keys
            }
        }
    };

    logger.debug('getting organsers from DynamoDB', { request });

    const response = await ddb.batchGet(request).promise();

    logger.debug('got organisers from DynamoDB', { response });

    return response.Responses[tableName];
};

const organisersNamesById = (organisers) => organisers.reduce((acc, organiser) => {
    acc[organiser.id] = organiser.name;
    return acc;
}, new Map());

const fetchOrganiserNamesForDocs = async (ddb, tableName, docs) => {

    const uniqueOrgIds = [...new Set(docs.map(doc => doc.orgId))];

    const orgById = await organisersByIds(ddb, tableName, uniqueOrgIds);

    return organisersNamesById(orgById);
};

const genDates = (fromDateStr, toDateStr, occurrences, maxDays) => {
    const fromDate = max([parseISO(fromDateStr), new Date()]);
    const toDate = min([parseISO(toDateStr), addDays(new Date(), maxDays)]);

    const generatedDates = occurrences.map(time => [time.hours, datesFromCron(`0 0 * * ${time.dayOfWeek}`, fromDate, toDate)]);

    const zip = (a, b) => Array.prototype.map.call(a, (e, i) => [e, b[i]]);

    const transform = (hours, dates) => zip(Array(dates.length).fill(hours), dates)
        .map(([hours, date]) => ({ time: hours, date: format(parseISO(date.toISOString()), 'yyyy-MM-dd') }));

    const dateTimes = generatedDates.flatMap(([hours, dates]) => transform(hours, Array.from(dates)));
    return dateTimes.sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

};

const enrichDocument = (thingToDo, organiserName) => {
    if (thingToDo.type !== 'EVENT') {
        const occurrences = thingToDo.when.occurrences;
        const fromDate = thingToDo.when.dateTime.from;
        const toDate = thingToDo.when.dateTime.to;
        const dates = genDates(fromDate, toDate, occurrences, 90);
        return {
            ...thingToDo,
            __meta__: {
                when: dates,
                organiser: organiserName
            }
        };
    } else {
        const dates = [{
            time: {
                from: format(parseISO(thingToDo.when.dateTime.from), 'HH:mm:ssX'),
                to: format(parseISO(thingToDo.when.dateTime.to), 'HH:mm:ssX')
            },
            date: format(parseISO(thingToDo.when.dateTime.from), 'yyyy-MM-dd')
        }];
        return {
            ...thingToDo,
            __meta__: {
                when: dates,
                organiser: organiserName
            }
        };
    }
};

const indexDocuments = async (es, index, toBeIndexed) => {
    try {
        logger.debug('indexing documents', { toBeIndexed });

        const body = toBeIndexed
            .flatMap(doc => [{ index: { _index: index, _id: doc.docId } }, doc.body]);

        const request = { refresh: true, body };

        logger.debug('elasticsearch bulk operation request', { request });

        const response = await es.bulk(request);

        logger.debug('elasticsearch response', { response });

        if (response.errors) {
            const erroredDocuments = [];

            response.items.forEach((action, i) => {
                const operation = Object.keys(action)[0];
                if (action[operation].error) {
                    erroredDocuments.push({
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    });
                }
            });
            logger.debug('elasticsearch errors', { erroredDocuments });

            const retryable = erroredDocuments.filter(doc => doc.status === 429);

            logger.debug('elasticsearch retryable', { retryable });
        }
        return !response.errors;
    } catch (e) {
        logger.error('elasticsearch bulk operation failed', { error: e.toString() });
        throw new Error('elasticsearch bulk operation failed');
    }
};

export { esIndex };