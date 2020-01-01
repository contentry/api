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

        it('should register a new user and return it', async () => {
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
            // safer would be to count before and after query, but after every test all users are deleted so this should be ok
            await expect(userRepository.count()).resolves.toEqual(1);
        });
        it('should return real 400 Bad Request or malformed GQL query', async () => {
            // GQL schema validation is out of scope of this app, so just one test to be sure
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
        it('should return fake 400 Bad Request for validation errors', async () => {
            // response.data = null, response.errors[0].message.statusCode = 400
            // validation decorators are tested in DTO test, so just pick one test to make sure the rules apply in this query as well
            // e.g. firstName field must not be empty
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

                it('should throw fake 401 Unauthorized if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(allUsersQuery);
                });
                it('should throw fake 403 Forbidden if user is not an admin', async () => {
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

                it('should throw real 400 Bad Request if the GQL query is malformed', async () => {
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
                it('should throw fake 401 Unauthorized if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(findUserByIDQuery(carlInfo.id));
                });
                it('should throw fake 403 Forbidden if user is not an admin', async () => {
                    const { accessToken: userToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    await assertQueryThrowsForbidden(findUserByIDQuery(carlInfo.id), userToken);
                });
                it('should return target user if user is logged and is an admin', async () => {
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

                it('should throw fake 401 Unauthorized if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(currentUserQuery);
                });
                it('should return current user if user is logged in', async () => {
                    const { accessToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    const res = await prepareGQLRequest(accessToken)
                        .send({ query: currentUserQuery });

                    expect(res.status).toEqual(200);
                    expect(res.body).toMatchObject({
                        data: {
                            currentUser: {
                                id: `${carlInfo.id}`,
                                firstName: carlInfo.firstName,
                                surname: carlInfo.surname,
                                email: carlInfo.email
                            }
                        }
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

                it('should throw real 400 Bad Request if GQL query is malformed', async () => {
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
                it('should throw fake 400 Bad Request if passed invalid data', async () => {
                    const { accessToken: userToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });
                    data.firstName = '';
                    await assertQueryThrowsBadRequest(updateCurrentUserQuery(data), userToken);
                });
                it('should throw fake 401 Unauthorized if user is not logged in', async () => {
                    await assertQueryThrowsUnauthorized(updateCurrentUserQuery(data));
                });
                it('should update user data and return him if user is logged in', async () => {
                    // updating logic is extensively tested in service tests
                    const { accessToken } = await authService.login({
                        email: carlInfo.email,
                        password: carlInfo.password
                    });

                    const res = await prepareGQLRequest(accessToken)
                        .send({ query: updateCurrentUserQuery(data) });

                    expect(res.status).toEqual(200);
                    expect(res.body).toMatchObject({
                        data: {
                            updateCurrentUser: {
                                id: `${carlInfo.id}`,
                                firstName: data.firstName,
                                surname: data.surname,
                                email: data.email
                            }
                        }
                    });

                    const user = await usersService.findByID(carlInfo.id);
                    expect(user).toMatchObject({
                        id: carlInfo.id,
                        firstName: data.firstName,
                        surname: data.surname,
                        email: data.email
                    });
                });
            });
        });
    });
});
