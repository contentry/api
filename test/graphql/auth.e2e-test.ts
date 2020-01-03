import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { getRepository, Repository } from 'typeorm';

import { AppModule } from '@app/app.module';
import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities';
import { gqlStringify, makeGQLHelperMethods } from '@test/helpers';

describe('GraphQL, Auth', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;

    let assertQueryThrowsBadRequest: (query: string, accessToken?: string) => Promise<void>;
    let prepareGQLRequest: (accessToken?: string) => request.Test;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        userRepository = getRepository(User);
        usersService = module.get(UsersService);

        // ensure a user exists
        await usersService.create({
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org',
            password: 'johnwick'
        });

        ({
            assertQueryThrowsBadRequest,
            prepareGQLRequest
        } = makeGQLHelperMethods(app));
    });

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
        await app.close();
    });

    describe('login()', () => {
        const login: any = {
            email: 'john.wick@contentry.org',
            password: 'johnwick'
        };

        beforeEach(() => {
            login.email = 'john.wick@contentry.org';
            login.password = 'johnwick';
        });

        it('should return JWT token on a successful login', async () => {
            const res = await prepareGQLRequest()
                .send({
                    query: `
                        mutation {
                            login(loginData: ${gqlStringify(login)}) {
                                accessToken
                                expiresIn
                            }
                        }`
                });
            expect(res.status).toEqual(200);
            expect(res.body).toMatchObject({
                data: {
                    login: {
                        accessToken: expect.any(String),
                        expiresIn: 3600
                    }
                }
            });
        });
        it('should return real 400 Bad Request on a malformed GQL query', async () => {
            const res = await prepareGQLRequest()
                .send({
                    query: `
                    mutation {
                        login(loginData: 1) {
                            accessToken
                            expiresIn
                        }
                    }`
                });
            expect(res.status).toEqual(400);
        });
        it('should return fake 400 Bad Request on a wrong login', async () => {
            login.password = 'blah';
            await assertQueryThrowsBadRequest(`
                mutation {
                    login(loginData: ${gqlStringify(login)}) {
                        accessToken
                        expiresIn
                    }
                }`
            );
        });
    });
});
