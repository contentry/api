import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';

describe('GraphQL, Users', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    it('should register a new user', async () => {
        const email: string = 'test@contentry.org';
        const res = await request(app.getHttpServer())
            .post('/graphql')
            .send({
                query: `
                    mutation {
                      createUser(data: {
                        firstName: "Test",
                        surname: "Testovich",
                        email: "${email}",
                        password: "testperson"
                      }) {
                          id
                          email
                      }
                    }`
            });
        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
            data: {
                createUser: {
                    email,
                    id: expect.any(String)
                }
            }
        });
    });

    afterEach(async () => {
        await app.close();
    });
});
