import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as _ from 'lodash';
import * as request from 'supertest';
import { getRepository, Repository } from 'typeorm';
import { AppModule } from '@app/app.module';
import { User } from '@modules/users/entities';
import { User as UserInterface } from '@modules/users/interfaces/user.interface';
import { UsersService } from '@modules/users/users.service';
import { constants } from '@utils/helpers/roles.helper';
import { AuthService } from '@modules/auth/auth.service';

describe('GraphQL, Users', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;
    let authService: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        userRepository = getRepository(User);
        usersService = module.get(UsersService);
        authService = module.get(AuthService);
    });

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
        await app.close();
    });

    describe('createUser()', () => {
        it('should register a new user', async () => {
            const user = {
                firstName: 'John',
                surname: 'Wick',
                email: 'test@contentry.org',
                password: 'johnwick'
            };
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
                        mutation {
                          createUser(data: {
                            firstName: "${user.firstName}",
                            surname: "${user.surname}",
                            email: "${user.email}",
                            password: "${user.password}"
                          }) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                });
            expect(res.status).toEqual(200);
            expect(res.body).toMatchObject({
                data: {
                    createUser: {
                        id: expect.any(String),
                        firstName: user.firstName,
                        surname: user.surname,
                        email: user.email
                    }
                }
            });
        });
        describe('should return bad request or malformed GQL query', () => {
            // directly 400 status code
            it('invalid data object', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
                            mutation {
                              createUser(data: 1) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                    });
                expect(res.status).toEqual(400);
            });
            it('invalid firstName', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
                            mutation {
                              createUser(data: {
                                firstName: 1,
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                    });
                expect(res.status).toEqual(400);
            });
            it('invalid surname', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: 1,
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                    });
                expect(res.status).toEqual(400);
            });
            it('invalid email', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: 1,
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                    });
                expect(res.status).toEqual(400);
            });
            it('invalid password', async () => {
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: 1
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                    });
                expect(res.status).toEqual(400);
            });
        });
        describe('should return 200 "bad request" for validation errors', () => {
            // response.data = null, response.errors[0].message.statusCode = 400
            describe('firstName field', () => {
                it('empty', async () => {
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "",
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    // TODO: more robust?
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
                it('longer than 100 chars', async () => {
                    const firstName = _.repeat('a', 101);
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "${firstName}",
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
            });
            describe('surname field', () => {
                it('empty', async () => {
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "",
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
                it('longer than 100 chars', async () => {
                    const surname = _.repeat('a', 101);
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "${surname}",
                                email: "test@contentry.org",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
            });
            describe('email field', () => {
                it('empty', async () => {
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: "",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
                it('not an email', async () => {
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: "thisisnotanemail",
                                password: "johnwick"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
            });
            describe('password field', () => {
                it('shorter than 6 chars', async () => {
                    const password = _.repeat('a', 5);
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: "${password}"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
                it('longer than 50 chars', async () => {
                    const password = _.repeat('a', 51);
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({
                            query: `
                            mutation {
                              createUser(data: {
                                firstName: "John",
                                surname: "Wick",
                                email: "test@contentry.org",
                                password: "${password}"
                              }) {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });
                    expect(res.status).toEqual(200);
                    expect(res.body.data).toBeNull();
                    expect(res.body.errors[0].message.statusCode).toEqual(400);
                });
            });
        });
    });

    describe('methods that require login', () => {
        // in order to reduce duplication with setting up 2 users before each test
        const carlInfo: UserInterface = {
            firstName: 'Carl',
            surname: 'Johnson',
            email: 'carl.johnson@contentry.org',
            password: 'carljohnson'
        };
        const johnInfo: UserInterface = {
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org',
            password: 'johnwick'
        };
        // ID's are separate, so they don't interfere with saving new user to the repository between tests
        let carlId: number;
        let johnId: number;

        // helper methods as the guard testing gets really repetitive
        const assertQueryThrowsStatusCode = async (query: string, statusCode: number, accessToken?: string) => {
            let requestPromise = request(app.getHttpServer()).post('/graphql');

            if (accessToken) {
                requestPromise = requestPromise.set('Authorization', `Bearer ${accessToken}`);
            }

            const res = await requestPromise.send({ query });

            expect(res.status).toEqual(200);
            expect(res.body.data).toBeNull();
            expect(res.body.errors[0].message.statusCode).toEqual(statusCode);
        };
        // unauthorized requests are those that are not logged in = no accessToken in arguments
        const assertQueryThrowsUnauthorized = async (query: string) =>
            await assertQueryThrowsStatusCode(query, 401);
        // forbidden requests are those that are logged in but lack permissions = we require login and pass the accessToken
        const assertQueryThrowsForbidden = async (query: string, accessToken: string) =>
            await assertQueryThrowsStatusCode(query, 403, accessToken);

        beforeEach(async () => {
            // Carl - just a user
            await usersService.create({ ...carlInfo });
            let createdUser = await usersService.findByEmail(carlInfo.email);
            carlId = createdUser.id;
            // John - user and admin
            await usersService.create({ ...johnInfo });
            createdUser = await usersService.findByEmail(johnInfo.email, true);
            johnId = createdUser.id;
            await usersService.assignRole(createdUser, constants.ADMIN);
        });

        describe('methods that require admin role', () => {
            describe('allUsers()', () => {
                const allUsersQuery = `
                    query {
                      allUsers {
                          id
                          firstName
                          surname
                          email
                      }
                    }`;

                it('should throw fake 401 if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(allUsersQuery);
                });
                it('should throw fake 403 if user is not an admin', async () => {
                    const { accessToken: userToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    await assertQueryThrowsForbidden(allUsersQuery, userToken);
                });
                it('should return all users if user is logged and is an admin', async () => {
                    const { accessToken: adminToken } = await authService.login({
                        email: johnInfo.email,
                        password: johnInfo.password
                    });
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({ query: allUsersQuery });

                    expect(res.status).toEqual(200);
                    expect(res.body).toMatchObject({
                        data: {
                            allUsers: [
                                {
                                    id: expect.any(String),
                                    firstName: carlInfo.firstName,
                                    surname: carlInfo.surname,
                                    email: carlInfo.email
                                },
                                {
                                    id: expect.any(String),
                                    firstName: johnInfo.firstName,
                                    surname: johnInfo.surname,
                                    email: johnInfo.email
                                }
                            ]
                        }
                    });
                });
            });
            describe('findUserByID()', () => {
                const findUserByIDQuery = (id: number) => `
                    query {
                      findUserByID(id: ${id}) {
                          id
                          firstName
                          surname
                          email
                      }
                    }`;

                it('should throw fake 401 if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(findUserByIDQuery(carlId));
                });
                it('should throw fake 403 if user is not an admin', async () => {
                    const { accessToken: userToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    await assertQueryThrowsForbidden(findUserByIDQuery(carlId), userToken);
                });
                it('should return all users if user is logged and is an admin', async () => {
                    const { accessToken: adminToken } = await authService.login({
                        email: johnInfo.email,
                        password: johnInfo.password
                    });
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({ query: findUserByIDQuery(carlId) });

                    expect(res.status).toEqual(200);
                    expect(res.body).toMatchObject({
                        data: {
                            findUserByID: {
                                id: `${carlId}`,
                                firstName: carlInfo.firstName,
                                surname: carlInfo.surname,
                                email: carlInfo.email
                            }
                        }
                    });
                });
            });
        });
        describe('methods that do NOT require admin role', () => {
            describe('currentUser()', () => {
                const currentUserQuery = `
                    query {
                      currentUser {
                          id
                          firstName
                          surname
                          email
                      }
                    }`;

                it('should throw fake 401 if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(currentUserQuery);
                });
                describe('should return current user if user is logged in', () => {
                    it('and is a user', async () => {
                        const { accessToken: userToken } = await authService.login({
                            email: carlInfo.email,
                            password: carlInfo.password
                        });
                        const res = await request(app.getHttpServer())
                            .post('/graphql')
                            .set('Authorization', `Bearer ${userToken}`)
                            .send({ query: currentUserQuery });

                        expect(res.status).toEqual(200);
                        expect(res.body).toMatchObject({
                            data: {
                                currentUser: {
                                    id: `${carlId}`,
                                    firstName: carlInfo.firstName,
                                    surname: carlInfo.surname,
                                    email: carlInfo.email
                                }
                            }
                        });
                    });
                    it('and is an admin', async () => {
                        const { accessToken: adminToken } = await authService.login({
                            email: johnInfo.email,
                            password: johnInfo.password
                        });
                        const res = await request(app.getHttpServer())
                            .post('/graphql')
                            .set('Authorization', `Bearer ${adminToken}`)
                            .send({ query: currentUserQuery });

                        expect(res.status).toEqual(200);
                        expect(res.body).toMatchObject({
                            data: {
                                currentUser: {
                                    id: `${johnId}`,
                                    firstName: johnInfo.firstName,
                                    surname: johnInfo.surname,
                                    email: johnInfo.email
                                }
                            }
                        });
                    });
                });
            });
        });
    });
});
