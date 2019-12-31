import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { AppModule } from '@app/app.module';
import { User } from '@modules/users/entities';
import { UsersService } from '@modules/users/users.service';
import { UserRO } from '@modules/users/users.dto';
import { makeGQLHelperMethods } from '../helpers';

describe('GraphQL, Auth', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;
    let existingUser: UserRO;

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
        existingUser = await usersService.create({
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
        it('should return JWT token on a successful login', async () => {
            const res = await prepareGQLRequest()
                .send({
                    query: `
                        mutation {
                            login(loginData: {
                                email: "john.wick@contentry.org",
                                password: "johnwick"
                            }) {
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
        describe('should return 400 on a malformed GQL query', () => {
            it('invalid loginData object', async () => {
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
            it('invalid email field', async () => {
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                        mutation {
                            login(loginData: {
                                email: 1,
                                password: "johnwick"
                            }) {
                                accessToken
                                expiresIn
                            }
                        }`
                    });
                expect(res.status).toEqual(400);
            });
            it('invalid password field', async () => {
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                        mutation {
                            login(loginData: {
                                email: "john.wick@contentry.org",
                                password: 1
                            }) {
                                accessToken
                                expiresIn
                            }
                        }`
                    });
                expect(res.status).toEqual(400);
            });
        });
        it('should return fake 400 on a wrong login', async () => {
            await assertQueryThrowsBadRequest(`
                mutation {
                    login(loginData: {
                        email: "john.wick@contentry.org",
                        password: "blah"
                    }) {
                        accessToken
                        expiresIn
                    }
                }`
            );
        });
    });
});
