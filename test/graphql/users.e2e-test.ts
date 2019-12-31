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
import { makeGQLHelperMethods, gqlStringify } from '../helpers';

describe('GraphQL, Users', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;
    let authService: AuthService;

    let assertQueryThrowsBadRequest: (query: string, accessToken?: string) => Promise<void>;
    let assertQueryThrowsForbidden: (query: string, accessToken: string) => Promise<void>;
    let assertQueryThrowsUnauthorized: (query: string) => Promise<void>;
    let prepareGQLRequest: (accessToken?: string) => request.Test;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        userRepository = getRepository(User);
        usersService = module.get(UsersService);
        authService = module.get(AuthService);

        // construct helper methods using the app instance, assign to declared variable
        // fugly syntax but works
        // (ordinary const { ... } = func(); syntax works, but is unavailable outside beforeEach())
        ({
            assertQueryThrowsBadRequest,
            assertQueryThrowsForbidden,
            assertQueryThrowsUnauthorized,
            prepareGQLRequest
        } = makeGQLHelperMethods(app));
    });

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
        await app.close();
    });

    describe('createUser()', () => {
        const user: any = {
            firstName: 'John',
            surname: 'Wick',
            email: 'test@contentry.org',
            password: 'johnwick'
        };

        beforeEach(() => {
            // reset the values
            user.firstName = 'John';
            user.surname = 'Wick';
            user.email = 'test@contentry.org';
            user.password = 'johnwick';
        });

        it('should register a new user', async () => {
            const res = await prepareGQLRequest()
                .send({
                    query: `
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
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
                const res = await prepareGQLRequest()
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
                user.firstName = 1;
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                            mutation {
                              createUser(data: ${gqlStringify(user)}) {
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
                user.surname = 1;
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                            mutation {
                              createUser(data: ${gqlStringify(user)}) {
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
                user.email = 1;
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                            mutation {
                              createUser(data: ${gqlStringify(user)}) {
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
                user.password = 1;
                const res = await prepareGQLRequest()
                    .send({
                        query: `
                            mutation {
                              createUser(data: ${gqlStringify(user)}) {
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
                    user.firstName = '';
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
                it('longer than 100 chars', async () => {
                    user.firstName = _.repeat('a', 101);
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
            });
            describe('surname field', () => {
                it('empty', async () => {
                    user.surname = '';
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
                it('longer than 100 chars', async () => {
                    user.surname = _.repeat('a', 101);
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
            });
            describe('email field', () => {
                it('empty', async () => {
                    user.email = '';
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
                it('not an email', async () => {
                    user.email = 'thisisnotanemail';
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
            });
            describe('password field', () => {
                it('shorter than 6 chars', async () => {
                    user.password = _.repeat('a', 5);
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
                });
                it('longer than 50 chars', async () => {
                    user.password = _.repeat('a', 51);
                    await assertQueryThrowsBadRequest(`
                        mutation {
                          createUser(data: ${gqlStringify(user)}) {
                              id
                              firstName
                              surname
                              email
                          }
                        }`
                    );
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

        beforeEach(async () => {
            // remove IDs from the info objects before creating the users
            delete carlInfo.id;
            delete johnInfo.id;
            // Carl - just a user
            await usersService.create({ ...carlInfo });
            let createdUser = await usersService.findByEmail(carlInfo.email);
            carlInfo.id = createdUser.id;
            // John - user and admin
            await usersService.create({ ...johnInfo });
            createdUser = await usersService.findByEmail(johnInfo.email, true);
            johnInfo.id = createdUser.id;
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
                    const res = await prepareGQLRequest(adminToken)
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

                it('should throw real 400 if the GQL query is malformed ("id" not a number)', async () => {
                    const res = await prepareGQLRequest()
                        .send({ query: `
                            query {
                              findUserByID(id: "this is not a number") {
                                  id
                                  firstName
                                  surname
                                  email
                              }
                            }`
                        });

                    expect(res.status).toEqual(400);
                });
                it('should throw fake 401 if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(findUserByIDQuery(carlInfo.id));
                });
                it('should throw fake 403 if user is not an admin', async () => {
                    const { accessToken: userToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    await assertQueryThrowsForbidden(findUserByIDQuery(carlInfo.id), userToken);
                });
                it('should return all users if user is logged and is an admin', async () => {
                    const { accessToken: adminToken } = await authService.login({
                        email: johnInfo.email,
                        password: johnInfo.password
                    });
                    const res = await prepareGQLRequest(adminToken)
                        .send({ query: findUserByIDQuery(carlInfo.id) });

                    expect(res.status).toEqual(200);
                    expect(res.body).toMatchObject({
                        data: {
                            findUserByID: {
                                id: `${carlInfo.id}`,
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
            // we should still make sure that it works with admin role as well
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
                    const actualCurrentUserTest = async (userInfo: any) => {
                        const { accessToken } = await authService.login({
                            email: userInfo.email,
                            password: userInfo.password
                        });
                        const res = await prepareGQLRequest(accessToken)
                            .send({ query: currentUserQuery });

                        expect(res.status).toEqual(200);
                        expect(res.body).toMatchObject({
                            data: {
                                currentUser: {
                                    id: `${userInfo.id}`,
                                    firstName: userInfo.firstName,
                                    surname: userInfo.surname,
                                    email: userInfo.email
                                }
                            }
                        });
                    };

                    it('and is a user', async () => {
                        await actualCurrentUserTest(carlInfo);
                    });
                    it('and is an admin', async () => {
                        await actualCurrentUserTest(johnInfo);
                    });
                });
            });
            describe('updateCurrentUser()', () => {
                const data: any = {
                    firstName: 'Baba',
                    surname: 'Yaga',
                    email: 'baba.yaga@contentry.org'
                };

                const updateCurrentUserQuery = (dataObject: object): string =>
                    `mutation {
                        updateCurrentUser(data: ${gqlStringify(dataObject)}) {
                            id
                            firstName
                            surname
                            email
                        }
                    }`;

                beforeEach(() => {
                    data.firstName = 'Baba';
                    data.surname = 'Yaga';
                    data.email = 'baba.yaga@contentry.org';
                });

                describe('should throw real 400 if GQL query is malformed', () => {
                    it('invalid data object', async () => {
                        const { accessToken: userToken } = await authService.login({
                            email: carlInfo.email,
                            password: carlInfo.password
                        });
                        const res = await prepareGQLRequest(userToken)
                            .send({
                                query: `
                                mutation {
                                    updateCurrentUser(data: 1) {
                                        id
                                        firstName
                                        surname
                                        email
                                    }
                                }
                            `
                            });

                        expect(res.status).toEqual(400);
                    });
                    it('invalid firstName', async () => {
                        const { accessToken: userToken } = await authService.login({
                            email: carlInfo.email,
                            password: carlInfo.password
                        });
                        data.firstName = 1;
                        const res = await prepareGQLRequest(userToken)
                            .send({
                                query: `
                                mutation {
                                    updateCurrentUser(data: ${gqlStringify(data)}) {
                                        id
                                        firstName
                                        surname
                                        email
                                    }
                                }
                            `
                            });

                        expect(res.status).toEqual(400);
                    });
                    it('invalid surname', async () => {
                        const { accessToken: userToken } = await authService.login({
                            email: carlInfo.email,
                            password: carlInfo.password
                        });
                        data.surname = 1;
                        const res = await prepareGQLRequest(userToken)
                            .send({
                                query: `
                                    mutation {
                                        updateCurrentUser(data: ${gqlStringify(data)}) {
                                            id
                                            firstName
                                            surname
                                            email
                                        }
                                    }
                                `
                            });

                        expect(res.status).toEqual(400);
                    });
                    it('invalid email', async () => {
                        const { accessToken: userToken } = await authService.login({
                            email: carlInfo.email,
                            password: carlInfo.password
                        });
                        data.email = 1;
                        const res = await prepareGQLRequest(userToken)
                            .send({
                                query: `
                                mutation {
                                    updateCurrentUser(data: ${gqlStringify(data)}) {
                                        id
                                        firstName
                                        surname
                                        email
                                    }
                                }
                            `
                            });

                        expect(res.status).toEqual(400);
                    });
                });

                describe('should throw fake 400 if passed invalid data', () => {
                    describe('firstName', () => {
                        it('empty', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.firstName = '';
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                        it('longer than 100 chars', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.firstName = _.repeat('a', 101);
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                    });
                    describe('surname', () => {
                        it('empty', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.surname = '';
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                        it('longer than 100 chars', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.surname = _.repeat('a', 101);
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                    });
                    describe('email', () => {
                        it('empty', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.email = '';
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                        it('not an email', async () => {
                            const { accessToken: userToken } = await authService.login({
                                email: carlInfo.email,
                                password: carlInfo.password
                            });
                            data.email = 'thisisnotanemail';
                            await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                        });
                    });
                });

                it('should throw fake 401 if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(updateCurrentUserQuery(data));
                });

                // since we want to test the same functionality for user and admin, I extracted the test themselves out
                // they differ only in who is logged in, so we pass that info as a parameter
                const actualUserUpdateTests = (userInfo: any) => {
                    it('shouldn\'t change any data if passed an empty object', async () => {
                        const { accessToken } = await authService.login({
                            email: userInfo.email,
                            password: userInfo.password
                        });
                        const res = await prepareGQLRequest(accessToken)
                            .send({ query: updateCurrentUserQuery({}) });

                        expect(res.status).toEqual(200);
                        expect(res.body).toMatchObject({
                            data: {
                                updateCurrentUser: {
                                    id: `${userInfo.id}`,
                                    firstName: userInfo.firstName,
                                    surname: userInfo.surname,
                                    email: userInfo.email
                                }
                            }
                        });
                    });
                    describe('should change user data', () => {
                        describe('single field', () => {
                            it('firstName', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.surname;
                                delete data.email;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: data.firstName,
                                            surname: userInfo.surname,
                                            email: userInfo.email
                                        }
                                    }
                                });
                            });
                            it('surname', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.firstName;
                                delete data.email;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: userInfo.firstName,
                                            surname: data.surname,
                                            email: userInfo.email
                                        }
                                    }
                                });
                            });
                            it('email', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.firstName;
                                delete data.surname;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: userInfo.firstName,
                                            surname: userInfo.surname,
                                            email: data.email
                                        }
                                    }
                                });
                            });
                        });
                        describe('two fields', () => {
                            it('firstName and surname', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.email;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: data.firstName,
                                            surname: data.surname,
                                            email: userInfo.email
                                        }
                                    }
                                });
                            });
                            it('firstName and email', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.surname;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: data.firstName,
                                            surname: userInfo.surname,
                                            email: data.email
                                        }
                                    }
                                });
                            });
                            it('surname and email', async () => {
                                const { accessToken } = await authService.login({
                                    email: userInfo.email,
                                    password: userInfo.password
                                });

                                delete data.firstName;
                                const res = await prepareGQLRequest(accessToken)
                                    .send({ query: updateCurrentUserQuery(data) });

                                expect(res.status).toEqual(200);
                                expect(res.body).toMatchObject({
                                    data: {
                                        updateCurrentUser: {
                                            id: `${userInfo.id}`,
                                            firstName: userInfo.firstName,
                                            surname: data.surname,
                                            email: data.email
                                        }
                                    }
                                });
                            });
                        });
                        it('all fields', async () => {
                            const { accessToken } = await authService.login({
                                email: userInfo.email,
                                password: userInfo.password
                            });

                            const res = await prepareGQLRequest(accessToken)
                                .send({ query: updateCurrentUserQuery(data) });

                            expect(res.status).toEqual(200);
                            expect(res.body).toMatchObject({
                                data: {
                                    updateCurrentUser: {
                                        id: `${userInfo.id}`,
                                        firstName: data.firstName,
                                        surname: data.surname,
                                        email: data.email
                                    }
                                }
                            });
                        });
                    });
                };

                describe('should work if user is just a user', () => {
                    actualUserUpdateTests(carlInfo);
                });
                describe('should work if user is an admin', () => {
                    actualUserUpdateTests(johnInfo);
                });
            });
        });
    });
});
