import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as _ from 'lodash';
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

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
    });

    afterAll(async () => {
        await app.close();
    });
});
