import { esDeleteIndices } from '../esDeleteIndices/esDeleteIndices';
import { esSetup } from '../esSetup/esSetup';

const config = require('../esSetup/setup-things-todo.json');

const clearEs = (es, indices) => esDeleteIndices({ es, indices })({});

const setUpEs = (es, index) => esSetup({ es, config, index })({});

export {
    clearEs,
    setUpEs
};