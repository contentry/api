import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { AppModule } from '@app/app.module';
import { User } from '@modules/users/entities';

describe('GraphQL, Users', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        userRepository = getRepository(User);
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
        await userRepository.query('DELETE FROM users');
    });

    afterAll(async () => {
        await app.close();
    });
});
