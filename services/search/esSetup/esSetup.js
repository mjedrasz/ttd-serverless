
import logger from '@dazn/lambda-powertools-logger';

const esSetup = ({ es, index, config }) => async (_) => {

    logger.debug('Setting up elasticsearch', { index, config });

    try {
        const response = await es.indices.create({
            index,
            body: config
        }, { ignore: [400] });
        logger.debug('elasticsearch response', { esResponse: response });
    } catch (e) {
        logger.error('elasticsearch operation failed', { error: JSON.stringify(e) });
        throw new Error('elasticsearch operation failed', e);
    }
};

export { esSetup };
