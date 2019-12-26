import { esDeleteIndices } from '../esDeleteIndices/esDeleteIndices';
import { Client } from 'elasticsearch';
import { setUpEs } from '../testLib/es';

const axios = require('axios').default;

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';

const es = Client({
    host: ES_ENDPOINT
});

describe('deleting es indices', () => {

    test('should delete indices', async () => {
        const deps = {
            es,
            indices: [ES_INDEX],
        };

        await setUpEs(es, ES_INDEX);

        await esDeleteIndices(deps)({});

        const response = await axios.head(`${ES_ENDPOINT}/${ES_INDEX}`, {
            validateStatus: (_) => true
        });
        
        expect(response.status).toBe(404);
    });
});
