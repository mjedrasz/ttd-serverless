const clearDb = async (ddb, tableName) => {
    const response = await ddb.scan({ TableName: tableName }).promise();
    const requests = response.Items.map(({ id, sk }) => ({
        DeleteRequest: {
            Key: { id, sk }
        }
    }));
    if (requests.length > 0) {
        await ddb.batchWrite({
            RequestItems: {
                [tableName]: requests
            }
        }).promise();
    }
};

export {
    clearDb
};