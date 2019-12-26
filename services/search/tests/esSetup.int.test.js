import { esSetup } from '../esSetup/esSetup';
import { Client } from 'elasticsearch';
import { clearEs } from '../testLib/es';

const axios = require('axios').default;
const config = require('../esSetup/setup-things-todo.json');

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';

const es = Client({
    host: ES_ENDPOINT
});

describe('setting up index', () => {

    test('should setup thing todo', async () => {
        const deps = {
            es,
            index: ES_INDEX,
            config
        };

        await esSetup(deps)({});
        const response = await axios.head(`${ES_ENDPOINT}/${ES_INDEX}`, {
            validateStatus: (_) => true
        });
        
        expect(response.status).toBe(200);
        await clearEs(es, [ES_INDEX]);
    });
});
