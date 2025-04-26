const query = request.data?.query;

const terms = await connection.sql`
    SELECT * FROM terms
    WHERE term is ${query}
    LIMIT 1
`;

await Promise.all(terms.map(async term => {
    const abbrev = await connection.sql`
        SELECT name FROM abbrev
        WHERE term = ${term.id}
    `;
    term.abbrev = abbrev.map(entry => entry.name);
}));

return {
    data: terms
};
