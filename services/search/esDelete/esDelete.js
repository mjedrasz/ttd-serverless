import logger from '@dazn/lambda-powertools-logger';

const esDelete = ({ es, index }) => async (event) => {

    logger.debug('received event', { event });

    const snsMessage = event.Records[0].Sns.Message;

    const docs = JSON.parse(snsMessage).Records;

    const toBeDeleted = docs.map(doc => doc.id);

    return await deleteDocuments(es, index, toBeDeleted);
};

const deleteDocuments = async (es, index, toBeDeleted) => {
    try {
        logger.debug('records to be deleted', { toBeDeleted });

        const body = toBeDeleted.map(id => ({ delete: { _index: index, _id: id } }));

        const request = { refresh: true, body };

        logger.debug('elasticsearch bulk operation request', { request });

        const response = await es.bulk(request);

        logger.debug('elasticsearch response', { response });

        return !response.errors;

    } catch (e) {
        logger.error('elasticsearch bulk operation failed', { error: e.toString() });
        throw new Error('elasticsearch bulk operation failed', e);
    }
};

export { esDelete };