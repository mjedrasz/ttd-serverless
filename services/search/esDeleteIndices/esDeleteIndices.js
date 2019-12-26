import logger from '@dazn/lambda-powertools-logger';

const esDeleteIndices = ({ es, indices }) => async (_) => {

    logger.debug('deleting indices', { indices });

    try {
        const response = await es.indices.delete({
            index: indices.join(',')
        }, { ignore: [404] });

        logger.debug('elasticsearch response', { esResponse: response });
    } catch (e) {
        logger.error('elasticsearch operation failed', { error: JSON.stringify(e) });
        throw new Error('elasticsearch operation failed', e);
    }
};

export { esDeleteIndices };
