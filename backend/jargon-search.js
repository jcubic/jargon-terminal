const query = request.data.query;

const result = await connection.sql`
    SELECT term FROM terms
    WHERE term LIKE '%' || ${query} || '%'
`;

return {
    data: result.map(item => item.term)
};
