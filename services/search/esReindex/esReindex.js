import logger from '@dazn/lambda-powertools-logger';
import Lambda from '@dazn/lambda-powertools-lambda-client';
import { blockify } from '../lib/ops';

const findDocumentsToReindex = async ({ es, index }) => {

    const request = {
        index,
        body: {
            _source: {
                excludes: ['__meta__'],
            },
            size: 10000,
            query: {
                bool: {
                    filter: [
                        {
                            bool: {
                                must_not: {
                                    term: {
                                        type: 'EVENT'
                                    }
                                }
                            }
                        },
                        {
                            range: {
                                'when.dateTime.from': {
                                    'lte': 'now+90d/d'
                                }
                            }
                        },
                        {
                            range: {
                                'when.dateTime.to': {
                                    'gte': 'now+90d/d'
                                }
                            }
                        },
                    ]
                }
            }
        }
    };

    logger.debug('elasticsearch request', { request });

    const response = await es.search(request);

    logger.debug('elasticsearch found documents', { response });

    return response.hits.hits.map(hit => hit._source);
};

const esReindex = ({ es, index, limits, indexFn }) => async () => {

    logger.debug('reindexing');

    const withSize = docs => {
        return docs.map(doc => {
            const buffer = Buffer.from(JSON.stringify(JSON.stringify(doc)), 'utf-8'); //it will be double stringify
            return {
                data: doc,
                size: buffer.length
            };
        });
    };

    const docs = await findDocumentsToReindex({ es, index });

    const blocks = blockify(withSize(docs), limits);

    const requests = blocks.map(block => ({
        Records: [
            {
                Sns: {
                    Message: JSON.stringify({ Records: block.map(record => record.data) })
                }
            }
        ]
    })).map(payload => ({
        FunctionName: indexFn,
        Payload: JSON.stringify(payload),
        InvocationType: 'Event'
    }));

    logger.debug('reindex requests', { requests });

    requests.map(req => Lambda.invoke(req).promise()); //don't wait for response

};

export { esReindex, findDocumentsToReindex };