import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

// helps with serializing objects for GQL queries
// JSON format = { "property": "value" }
// this outputs the GQL syntax = { property: "value" } (including {})
export const gqlStringify = (obj: object): string =>
    JSON.stringify(obj).replace(/"([^(")"]+)":/g, '$1:');

// GQL requests are always pointed at the same endpoint:
// POST http://localhost:<port>/graphql
// we get the URL from a INestApplication instance
// therefore makeGQLHelperMethods is a factory method that takes the NestApplication instance
// and generates methods that either prepares the GQL request (and possibly authenticate it)
// or execute a given query and assert it to throw "fake" 40x responses, because the assertions seem to be always the same
export const makeGQLHelperMethods = (app: INestApplication) => {
    const prepareGQLRequest = (accessToken?: string): request.Test => {
        const req = request(app.getHttpServer()).post('/graphql');
        if (accessToken) {
            return req.set('Authorization', `Bearer ${accessToken}`);
        }
        return req;
    };
    const assertQueryThrowsStatusCode = async (query: string, statusCode: number, accessToken?: string) => {
        const res = await prepareGQLRequest(accessToken).send({ query });

        expect(res.status).toEqual(200);
        expect(res.body.data).toBeNull();
        expect(res.body.errors[0].message.statusCode).toEqual(statusCode);
    };

    return {
        prepareGQLRequest,

        async assertQueryThrowsBadRequest(query: string, accessToken?: string) {
            return await assertQueryThrowsStatusCode(query, 400, accessToken);
        },
        // unauthorized requests are those that are not logged in = no accessToken in arguments
        async assertQueryThrowsUnauthorized(query: string) {
            return await assertQueryThrowsStatusCode(query, 401);
        },
        // forbidden requests are those that are logged in but lack permissions = we require login and pass the accessToken
        async assertQueryThrowsForbidden(query: string, accessToken: string) {
            return await assertQueryThrowsStatusCode(query, 403, accessToken);
        }
    };
};
