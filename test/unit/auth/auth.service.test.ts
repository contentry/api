import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '@modules/users/users.service';
import { AuthService } from '@modules/auth/auth.service';
import { User } from '@modules/users/entities';
import { User as UserInterface } from '@modules/users/interfaces';
import { PasswordsHelper } from '@utils/helpers/passwords.helper';

describe('AuthService', () => {
    let app: INestApplication;
    let authService: AuthService;

    // "mock interfaces"
    const mockJwtService = {
        sign: jest.fn()
    };

    const mockUsersService = {
        findByEmail: jest.fn()
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: mockJwtService
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService
                }
            ]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        authService = module.get(AuthService);
    });

    afterEach(async () => {
        await app.close();
    });

    describe('login()', () => {
        describe('throws bad request exception if credentials are wrong', () => {
            it('user doesn\'t exist', async () => {
                mockUsersService.findByEmail = jest.fn(() => null);

                const user: UserInterface = {
                    email: 'john.wick@contentry.org',
                    password: 'johnwick'
                };

                await expect(authService.login(user)).rejects.toThrow(BadRequestException);
            });
            it('user exists but password is wrong', async () => {
                // mock to return non-null user
                mockUsersService.findByEmail = jest.fn(() => new User({}));
                // mock to return false password compare result
                const originalPasswordCompare = PasswordsHelper.compare;
                PasswordsHelper.compare = jest.fn(() => Promise.resolve(false));

                const user: UserInterface = {
                    email: 'john.wick@contentry.org',
                    password: 'johnwick'
                };

                await expect(authService.login(user)).rejects.toThrow(BadRequestException);

                PasswordsHelper.compare = originalPasswordCompare;
            });
        });
        it('returns access token and expiration time if credentials are correct', async () => {
            mockUsersService.findByEmail = jest.fn(() => new User({}));

            mockJwtService.sign = jest.fn(() => 'token');

            const originalPasswordCompare = PasswordsHelper.compare;
            PasswordsHelper.compare = jest.fn(() => Promise.resolve(true));

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.login(user);

            expect(result).toEqual({
                accessToken: 'token',
                expiresIn: 3600
            });

            PasswordsHelper.compare = originalPasswordCompare;
        });
    });

    describe('findByEmailAndPass()', () => {
        it('returns null if user doesn\'t exist', async () => {
            mockUsersService.findByEmail = jest.fn(() => null);

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toBeNull();
        });
        it('returns null if password doesn\'t match', async () => {
            mockUsersService.findByEmail = jest.fn(() => new User({}));

            const originalPasswordCompare = PasswordsHelper.compare;
            PasswordsHelper.compare = jest.fn(() => Promise.resolve(false));

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toBeNull();
            PasswordsHelper.compare = originalPasswordCompare;
        });
        it('returns user if he exists and a correct password is provided', async () => {
            const existingUser = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            mockUsersService.findByEmail = jest.fn(() => existingUser);

            const originalPasswordCompare = PasswordsHelper.compare;
            PasswordsHelper.compare = jest.fn(() => Promise.resolve(true));

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toEqual({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            PasswordsHelper.compare = originalPasswordCompare;
        });
    });

    describe('validate()', () => {
        it('returns user if the payload email is his', async () => {
            const email = 'john.wick@contentry.org';
            const expectedUser = new User({
                email,
                id: 1,
                firstName: 'John',
                surname: 'Wick'
            });
            mockUsersService.findByEmail = jest.fn(() => expectedUser);

            const user = await authService.validate({ email });
            expect(user).toEqual(expectedUser);
        });
        it('returns null if user with payload email doesn\'t exist', async () => {
            mockUsersService.findByEmail = jest.fn(() => null);

            const user = await authService.validate({
                email: 'john.wick@contentry.org'
            });
            expect(user).toBeNull();
        });
    });
});
