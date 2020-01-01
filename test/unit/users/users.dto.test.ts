import 'reflect-metadata';
import * as _ from 'lodash';
import { validateOrReject } from 'class-validator';
import { CreateUserDTO, UpdateUserDTO } from '@modules/users/users.dto';

describe('User (input) DTOs', () => {
    describe('CreateUserDTO', () => {
        const passingObject = {
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org',
            password: 'johnwick'
        };

        describe('firstName', () => {
            it('must be longer than or equal 1 char', async () => {
                // test both ends of the constraint
                const valid = new CreateUserDTO({
                    ...passingObject,
                    firstName: 'a'
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    firstName: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be shorter than or equal 100 chars', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject,
                    firstName: _.repeat('a', 100)
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    firstName: _.repeat('a', 101)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
        describe('surname', () => {
            it('must be longer than or equal 1 char', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject,
                    surname: 'a'
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    surname: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be shorter than or equal 100 chars', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject,
                    surname: _.repeat('a', 100)
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    surname: _.repeat('a', 101)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
        describe('email', () => {
            it('can\'t be empty', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    email: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be an email', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    email: 'thisIsNotAnEmail'
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
        describe('password', () => {
            it('must be longer than or equal 6 chars', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject,
                    password: _.repeat('a', 6)
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    password: _.repeat('a', 5)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be shorter than or equal 50 chars', async () => {
                const valid = new CreateUserDTO({
                    ...passingObject,
                    password: _.repeat('a', 50)
                });
                const invalid = new CreateUserDTO({
                    ...passingObject,
                    password: _.repeat('a', 51)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
    });
    describe('UpdateUserDTO', () => {
        const passingObject = {
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org'
        };

        describe('firstName', () => {
            it('can be optional', async () => {
                const valid = new UpdateUserDTO({
                    surname: passingObject.surname,
                    email: passingObject.email
                });

                await expect(validateOrReject(valid)).resolves;
            });
            it('must be longer than or equal 1 char', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject,
                    firstName: 'a'
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    firstName: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be shorter than or equal 100 chars', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject,
                    firstName: _.repeat('a', 100)
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    firstName: _.repeat('a', 101)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
        describe('surname', () => {
            it('can be optional', async () => {
                const valid = new UpdateUserDTO({
                    firstName: passingObject.firstName,
                    email: passingObject.email
                });

                await expect(validateOrReject(valid)).resolves;
            });
            it('must be longer than or equal 1 char', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject,
                    surname: 'a'
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    surname: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be shorter than or equal 100 chars', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject,
                    surname: _.repeat('a', 100)
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    surname: _.repeat('a', 101)
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
        describe('email', () => {
            it('can be optional', async () => {
                const valid = new UpdateUserDTO({
                    firstName: passingObject.firstName,
                    surname: passingObject.surname
                });

                await expect(validateOrReject(valid)).resolves;
            });
            it('can\'t be empty', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    email: ''
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
            it('must be an email', async () => {
                const valid = new UpdateUserDTO({
                    ...passingObject
                });
                const invalid = new UpdateUserDTO({
                    ...passingObject,
                    email: 'thisIsNotAnEmail'
                });

                await expect(validateOrReject(valid)).resolves;
                await expect(validateOrReject(invalid)).rejects.toHaveLength(1);
            });
        });
    });
});
