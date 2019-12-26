import { esDelete } from '../esDelete/esDelete';
import { Client } from 'elasticsearch';
import { clearEs, setUpEs } from '../testLib/es';
import { DELETED } from '../lib/thingToDoStatuses';

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';

const es = Client({
    host: ES_ENDPOINT
});

describe('deleting es documents', () => {

    beforeEach(async () => {
        await setUpEs(es, ES_INDEX);
    });

    afterEach(async () => {
        await clearEs(es, [ES_INDEX]);
    });

    test('should delete documents', async () => {
        const deps = {
            es,
            index: ES_INDEX
        };

        const dataset = [{
            id: 'doc-1',
            text: 'doc 1'
        }, {
            id: 'doc-2',
            text: 'doc 2'
        }, {
            id: 'doc-3',
            text: 'doc 3'
        }];

        const body = dataset.flatMap(doc => [{ index: { _index: ES_INDEX } }, doc])

        await es.bulk({ refresh: true, body });

        const message = {
            Records: [
                {

                    id: dataset[0].id,
                    text: dataset[0].text,
                    status: DELETED
                },
                {

                    id: dataset[2].id,
                    text: dataset[2].text,
                    status: DELETED

                }
            ]
        }

        const event = {
            Records: [
                {
                    EventSource: 'aws:sns',
                    EventVersion: '1.0',
                    Sns: {
                        Type: 'Notification',
                        Message: JSON.stringify(message)
                    }
                }
            ]
        };

        const response = await esDelete(deps)(event);

        expect(response).toBe(true);
    });
});
